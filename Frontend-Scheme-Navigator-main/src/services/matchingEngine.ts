import { Scheme, UserProfile, SchemeMatchResult, MatchFactor } from '../types';

export function calculateSchemeMatch(scheme: Scheme, profile: UserProfile): SchemeMatchResult {
  const factors: MatchFactor[] = [];
  const matchedReasons: string[] = [];
  const unmatchedWarnings: string[] = [];

  const eligibility = scheme?.eligibility || {};
  const coveredStates = Array.isArray(scheme?.coveredStates) ? scheme.coveredStates : ['All India'];

  let totalScore = 0;
  const userAge = typeof profile?.age === 'number' ? profile.age : null;

  // 1. AGE FACTOR (Weight: 20)
  const minAge = eligibility.minAge ?? 0;
  const maxAge = eligibility.maxAge ?? 100;

  if (userAge !== null) {
    if (userAge >= minAge && userAge <= maxAge) {
      totalScore += 20;
      const explanation = `Your age (${userAge} yrs) satisfies the required age bracket (${minAge}–${maxAge} yrs).`;
      matchedReasons.push(`Age requirement compatible (${minAge}–${maxAge} years)`);
      factors.push({
        criterion: 'Age Criteria',
        status: 'matched',
        explanation,
        weight: 20,
        score: 20,
      });
    } else {
      const explanation = `Scheme generally targets ${minAge}–${maxAge} yrs (provided age: ${userAge} yrs).`;
      unmatchedWarnings.push(`Age eligibility typically requires between ${minAge} and ${maxAge} years.`);
      factors.push({
        criterion: 'Age Criteria',
        status: 'mismatch',
        explanation,
        weight: 20,
        score: 0,
      });
    }
  } else {
    // Unspecified age defaults to neutral baseline
    totalScore += 12;
    factors.push({
      criterion: 'Age Criteria',
      status: 'neutral',
      explanation: `Scheme targets ages ${minAge}–${maxAge} yrs (provide age in profile for precise match).`,
      weight: 20,
      score: 12,
    });
  }

  // 2. STATE / LOCATION FACTOR (Weight: 20)
  const isAllIndia = coveredStates.includes('All India') || coveredStates.length === 0;
  const userState = profile?.state;

  if (isAllIndia) {
    totalScore += 20;
    matchedReasons.push(`Applicable across All India including ${userState || 'your state'}`);
    factors.push({
      criterion: 'State / Location',
      status: 'matched',
      explanation: 'This is a Central / Nationwide scheme valid across all Indian states and UTs.',
      weight: 20,
      score: 20,
    });
  } else if (userState && coveredStates.includes(userState)) {
    totalScore += 20;
    matchedReasons.push(`State-specific scheme actively active in ${userState}`);
    factors.push({
      criterion: 'State / Location',
      status: 'matched',
      explanation: `Scheme is specially implemented by the State Government of ${userState}.`,
      weight: 20,
      score: 20,
    });
  } else if (userState) {
    unmatchedWarnings.push(`This scheme is specific to ${coveredStates.join(', ')} (your state is ${userState}).`);
    factors.push({
      criterion: 'State / Location',
      status: 'mismatch',
      explanation: `Restricted to residents of ${coveredStates.join(', ')}.`,
      weight: 20,
      score: 0,
    });
  } else {
    totalScore += 10;
    factors.push({
      criterion: 'State / Location',
      status: 'neutral',
      explanation: `Valid in ${coveredStates.join(', ')}.`,
      weight: 20,
      score: 10,
    });
  }

  // 3. EMPLOYMENT / OCCUPATION FACTOR (Weight: 15)
  const allowedOcc = Array.isArray(eligibility.allowedOccupations) ? eligibility.allowedOccupations : [];
  const userOcc = profile?.employmentType;

  if (allowedOcc.length === 0 || allowedOcc.includes('All' as any)) {
    totalScore += 15;
    matchedReasons.push('Open to all employment and occupation backgrounds');
    factors.push({
      criterion: 'Occupation',
      status: 'matched',
      explanation: 'Open to all occupation types.',
      weight: 15,
      score: 15,
    });
  } else if (userOcc && allowedOcc.includes(userOcc as any)) {

    totalScore += 15;
    matchedReasons.push(`Specifically tailored for ${userOcc}s`);
    factors.push({
      criterion: 'Occupation',
      status: 'matched',
      explanation: `Your occupation profile (${userOcc}) directly aligns with the target beneficiaries.`,
      weight: 15,
      score: 15,
    });
  } else if (userOcc) {
    // If not matching, partial or zero
    unmatchedWarnings.push(`Targeted primarily at: ${allowedOcc.join(', ')} (your profile: ${userOcc})`);
    factors.push({
      criterion: 'Occupation',
      status: 'mismatch',
      explanation: `Focuses on ${allowedOcc.join(', ')}.`,
      weight: 15,
      score: 3,
    });
  } else {
    totalScore += 8;
    factors.push({
      criterion: 'Occupation',
      status: 'neutral',
      explanation: `Beneficiaries: ${allowedOcc.join(', ')}.`,
      weight: 15,
      score: 8,
    });
  }

  // 4. INCOME FACTOR (Weight: 20)
  const userIncome = profile?.incomeRange;
  const maxIncome = eligibility.maxAnnualIncome ?? 0;
  const allowedRanges = Array.isArray(eligibility.incomeRangesAllowed) ? eligibility.incomeRangesAllowed : [];

  if (maxIncome === 0 && allowedRanges.length === 0) {
    totalScore += 20;
    matchedReasons.push('No restrictive annual income ceiling applied');
    factors.push({
      criterion: 'Income Ceiling',
      status: 'matched',
      explanation: 'No maximum income threshold restriction.',
      weight: 20,
      score: 20,
    });
  } else if (userIncome) {
    if (allowedRanges.length > 0) {
      if (allowedRanges.includes(userIncome)) {
        totalScore += 20;
        matchedReasons.push(`Income range (${userIncome}) satisfies financial eligibility criteria`);
        factors.push({
          criterion: 'Income Ceiling',
          status: 'matched',
          explanation: `Your income bracket (${userIncome}) is within the eligible range.`,
          weight: 20,
          score: 20,
        });
      } else {
        unmatchedWarnings.push(`Requires income within ${allowedRanges.join(' or ')} (your income: ${userIncome})`);
        factors.push({
          criterion: 'Income Ceiling',
          status: 'mismatch',
          explanation: `Scheme specifies income within ${allowedRanges.join(', ')}.`,
          weight: 20,
          score: 4,
        });
      }
    } else {
      // General low income check
      totalScore += 18;
      matchedReasons.push('Household income appears within acceptable limits');
      factors.push({
        criterion: 'Income Ceiling',
        status: 'matched',
        explanation: 'Income appears compatible.',
        weight: 20,
        score: 18,
      });
    }
  } else {
    totalScore += 12;
    factors.push({
      criterion: 'Income Ceiling',
      status: 'neutral',
      explanation: 'Income details not provided.',
      weight: 20,
      score: 12,
    });
  }

  // 5. GENDER FACTOR (Weight: 10)
  const allowedGenders = Array.isArray(eligibility.allowedGenders) ? eligibility.allowedGenders : ['all'];
  const userGender = profile?.gender;

  if (allowedGenders.includes('all' as any) || allowedGenders.length === 0) {
    totalScore += 10;
    factors.push({
      criterion: 'Gender Eligibility',
      status: 'matched',
      explanation: 'Open to all genders.',
      weight: 10,
      score: 10,
    });
  } else if (userGender && allowedGenders.includes(userGender as any)) {
    totalScore += 10;
    matchedReasons.push(`Gender-specific initiative matching your profile (${userGender})`);
    factors.push({
      criterion: 'Gender Eligibility',
      status: 'matched',
      explanation: `Directly targeted for ${userGender} applicants.`,
      weight: 10,
      score: 10,
    });
  } else if (userGender) {
    unmatchedWarnings.push(`Eligible for ${allowedGenders.join(', ')} applicants only.`);
    factors.push({
      criterion: 'Gender Eligibility',
      status: 'mismatch',
      explanation: `Restricted to ${allowedGenders.join(', ')}.`,
      weight: 10,
      score: 0,
    });
  } else {
    totalScore += 6;
    factors.push({
      criterion: 'Gender Eligibility',
      status: 'neutral',
      explanation: `Applicable for ${allowedGenders.join(', ')}.`,
      weight: 10,
      score: 6,
    });
  }

  // 6. CATEGORY & SPECIAL PROFILE SIGNALS (Weight: 15)
  let categoryScore = 0;
  const allowedCategories = Array.isArray(eligibility.allowedCategories) ? eligibility.allowedCategories : ['All'];
  const userCat = profile?.category;

  if (allowedCategories.includes('All' as any) || allowedCategories.length === 0) {
    categoryScore += 8;
  } else if (userCat && (allowedCategories.includes(userCat as any) || (userCat === 'Minority' && eligibility.requiresMinority))) {
    categoryScore += 8;
    matchedReasons.push(`Social category requirement met (${userCat})`);
  } else if (userCat) {
    unmatchedWarnings.push(`Reserved for ${allowedCategories.join(', ')} categories.`);
  }


  // Check special conditions: Disability, BPL, Minority
  let specialMatched = true;
  if (eligibility.requiresDisability) {
    if (profile?.isDisability) {
      categoryScore += 7;
      matchedReasons.push('Benchmark disability criteria satisfied');
    } else {
      specialMatched = false;
      unmatchedWarnings.push('Requires certificate of benchmark disability (40%+).');
    }
  } else if (eligibility.requiresBPL) {
    if (profile?.hasBPLCard || profile?.incomeRange === 'Below ₹1 lakh') {
      categoryScore += 7;
      matchedReasons.push('BPL / low economic bracket matched');
    } else {
      specialMatched = false;
      unmatchedWarnings.push('Priority given to BPL / Antyodaya ration card holders.');
    }
  } else {
    categoryScore += 7;
  }

  totalScore += Math.min(15, categoryScore);

  factors.push({
    criterion: 'Category & Special Signals',
    status: specialMatched ? 'matched' : 'mismatch',
    explanation: specialMatched
      ? 'Social category and economic status align with scheme guidelines.'
      : 'Special qualification or reservation criteria applies.',
    weight: 15,
    score: categoryScore,
  });

  // Clamp final score 0-100
  const normalizedScore = Math.max(10, Math.min(99, Math.round(totalScore)));

  let matchGrade: SchemeMatchResult['matchGrade'] = 'General Match';
  if (normalizedScore >= 85) matchGrade = 'High Potential';
  else if (normalizedScore >= 70) matchGrade = 'Good Match';
  else if (normalizedScore >= 50) matchGrade = 'Moderate Match';

  return {
    scheme,
    matchScore: normalizedScore,
    matchGrade,
    matchedReasons: matchedReasons.slice(0, 4),
    unmatchedWarnings: unmatchedWarnings.slice(0, 3),
    factors,
  };
}

export function rankSchemesForProfile(
  profile: UserProfile,
  schemes: Scheme[] = []
): SchemeMatchResult[] {
  const results = schemes.map((scheme) => calculateSchemeMatch(scheme, profile));

  // Sort descending by match score, then popularity
  return results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return b.scheme.popularScore - a.scheme.popularScore;
  });
}

