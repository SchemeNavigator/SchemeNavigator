"""
Management command: import_schemes

Usage:
    python manage.py import_schemes --source csv --file path/to/schemes.csv
    python manage.py import_schemes --source csv --file schemes.csv --dry-run
    python manage.py import_schemes --source api --url https://...  # (stub, not yet implemented)
"""
from django.core.management.base import BaseCommand, CommandError

from schemes.datasources import get_datasource
from schemes.models import Scheme


class Command(BaseCommand):
    help = "Import or re-import schemes from a CSV file or external API."

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            type=str,
            default="csv",
            choices=["csv", "api"],
            help="Data source type (default: csv)",
        )
        parser.add_argument(
            "--file",
            type=str,
            default="",
            help="Path to CSV file (required when --source=csv)",
        )
        parser.add_argument(
            "--url",
            type=str,
            default="",
            help="API URL (required when --source=api)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Parse and validate without writing to the database",
        )

    def handle(self, *args, **options):
        source_type = options["source"]
        dry_run = options["dry_run"]

        # Build kwargs for the chosen source
        if source_type == "csv":
            file_path = options["file"]
            if not file_path:
                raise CommandError("--file is required when --source=csv")
            source_kwargs = {"file_path": file_path}
        else:
            url = options["url"]
            if not url:
                raise CommandError("--url is required when --source=api")
            source_kwargs = {"url": url}

        self.stdout.write(f"Using source: {source_type}")
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN — no database writes."))

        try:
            datasource = get_datasource(source_type, **source_kwargs)
            raw_schemes = datasource.fetch_schemes()
        except (FileNotFoundError, NotImplementedError, ValueError) as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(f"Fetched {len(raw_schemes)} scheme(s) from source.")

        inserted = updated = skipped = 0

        for data in raw_schemes:
            slug = data.get("slug", "").strip()
            if not slug:
                skipped += 1
                continue

            # Validate required fields
            if not data.get("name") or not data.get("category"):
                self.stderr.write(
                    self.style.WARNING(f"Skipping '{slug}': missing name or category.")
                )
                skipped += 1
                continue

            if dry_run:
                self.stdout.write(f"  [dry-run] Would upsert: {slug}")
                continue

            defaults = {k: v for k, v in data.items() if k != "slug"}

            _, created = Scheme.objects.update_or_create(
                slug=slug,
                defaults=defaults,
            )
            if created:
                inserted += 1
            else:
                updated += 1

        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Done. Inserted: {inserted} | Updated: {updated} | Skipped: {skipped}"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Dry run complete. Would process: {len(raw_schemes)} record(s)."
                )
            )
