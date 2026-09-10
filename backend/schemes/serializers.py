"""
Scheme serializer — outputs all fields in the shape the frontend expects.
The nested JSON fields (eligibility, benefits, etc.) are stored as JSONB
and returned verbatim, so no nested serializer indirection is needed.
"""
from rest_framework import serializers
from .models import Scheme


class SchemeSerializer(serializers.ModelSerializer):
    # Expose the database PK as 'id' to match TypeScript Scheme.id
    id = serializers.CharField(source="slug")

    class Meta:
        model = Scheme
        fields = [
            "id",
            "slug",
            "name",
            "short_name",
            "tagline",
            "category",
            "level",
            "covered_states",
            "short_description",
            "detailed_description",
            "eligibility",
            "benefits",
            "documents",
            "application_steps",
            "verification",
            "popular_score",
            "tags",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Rename snake_case keys to camelCase to match TypeScript interface
        data["shortName"] = data.pop("short_name", "")
        data["coveredStates"] = data.pop("covered_states", [])
        data["shortDescription"] = data.pop("short_description", "")
        data["detailedDescription"] = data.pop("detailed_description", "")
        data["applicationSteps"] = data.pop("application_steps", [])
        data["popularScore"] = data.pop("popular_score", 0)
        return data
