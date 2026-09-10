import { Scheme } from '../types';

export const ADDITIONAL_SCHEMES: Scheme[] = [
  {
    id: 'pm-pmusp-scholarship-17',
    slug: 'pm-uchchatar-shiksha-protsahan-yojana',
    name: 'PM Uchchatar Shiksha Protsahan (PM-USP) Central Sector Scheme',
    shortName: 'PM-USP College Scholarship',
    tagline: 'Direct scholarship of ₹12,000 to ₹20,000 per year for meritorious college & university students.',
    category: 'Education',
    level: 'Central',
    coveredStates: ['All India'],
    shortDescription: 'Scholarship awarded to top percentile Class 12 board toppers pursuing regular undergraduate and postgraduate courses.',
    detailedDescription: 'The Central Sector Scheme of Scholarship for College and University Students (PM-USP CSSS) provides financial assistance to meritorious students from low-income families to meet a part of their daily expenses while pursuing higher studies in college and universities.',
    eligibility: {
      minAge: 17,
      maxAge: 25,
      allowedGenders: ['male', 'female', 'other', 'all'],
      allowedStates: ['All India'],
      allowedOccupations: ['Student'],
      allowedCategories: ['All'],
      maxAnnualIncome: 450000,
      incomeRangesAllowed: ['Below ₹1 lakh', '₹1–2.5 lakh', '₹2.5–5 lakh'],
      customConditions: [
        'Above 80th percentile in relevant stream in Class XII board examination',
        'Pursuing regular course in a recognized college/institution',
        'Gross parental/family annual income not exceeding ₹4.50 Lakh per annum'
      ]
    },
    benefits: [
      {
        title: 'Annual Cash Scholarship',
        description: '₹12,000 per annum for Graduation years (1st, 2nd, 3rd year) and ₹20,000 per annum for Post-Graduation years.',
        amountOrValue: '₹12k–₹20k / Year',
        type: 'Scholarship'
      }
    ],
    documents: [
      {
        id: 'doc-class12',
        name: 'Class 12th Board Marksheet',
        description: 'Showing percentile score.',
        isMandatory: true,
        documentType: 'education'
      },
      {
        id: 'doc-income-pmusp',
        name: 'Family Income Certificate (< ₹4.5L)',
        description: 'Issued by competent government revenue officer.',
        isMandatory: true,
        documentType: 'income'
      },
      {
        id: 'doc-college-bonafide',
        name: 'College Bonafide Student Certificate',
        description: 'Issued by college Principal / Registrar.',
        isMandatory: true,
        documentType: 'education'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Check Board Percentile Cut-off',
        description: 'Verify that your Class 12th board score is in the top 20th percentile list published by your State Board / CBSE.',
        tips: 'Cut-off lists are uploaded annually on the NSP portal.'
      },
      {
        stepNumber: 2,
        title: 'Apply on National Scholarship Portal',
        description: 'Select Department of Higher Education -> PM-USP Central Sector Scheme and submit details.',
        actionUrl: 'https://scholarships.gov.in'
      },
      {
        stepNumber: 3,
        title: 'Institute Verification & Direct DBT',
        description: 'College marks biometric / digital verification and money is disbursed annually.',
        actionUrl: 'https://scholarships.gov.in'
      }
    ],
    verification: {
      sourceDepartment: 'Department of Higher Education',
      ministryOrAuthority: 'Ministry of Education, Govt of India',
      lastUpdated: '15 January 2025',
      officialPortalUrl: 'https://scholarships.gov.in',
      helpline: '0120-6619540',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 93,
    tags: ['scholarship', 'college', 'students', 'merit', 'higher-education']
  },

  {
    id: 'pm-pmfby-crop-18',
    slug: 'pradhan-mantri-fasal-bima-yojana',
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    shortName: 'PM Fasal Bima Yojana',
    tagline: 'Comprehensive crop insurance against non-preventable natural risks with farmer premium as low as 1.5% to 2%.',
    category: 'Agriculture',
    level: 'Central',
    coveredStates: ['All India'],
    shortDescription: 'Provides financial security to farmers against crop loss/damage resulting from natural calamities, pests, hailstorms, unseasonal rains, and post-harvest losses.',
    detailedDescription: 'PMFBY provides comprehensive insurance coverage against crop loss due to non-preventable natural risks from pre-sowing to post-harvest stages. Farmers pay nominal uniform premiums: 2% for Kharif crops, 1.5% for Rabi food and oilseeds, and 5% for annual commercial/horticultural crops, with the remaining 90%+ premium subsidized equally by Central and State Governments.',
    eligibility: {
      minAge: 18,
      maxAge: 80,
      allowedGenders: ['male', 'female', 'other', 'all'],
      allowedStates: ['All India'],
      allowedOccupations: ['Farmer'],
      allowedCategories: ['All'],
      customConditions: [
        'All farmers including sharecroppers and tenant farmers growing notified crops in notified areas',
        'Enrollment must be completed before the seasonal cut-off date published by State Agriculture Department'
      ]
    },
    benefits: [
      {
        title: 'Comprehensive Risk Shield',
        description: 'Covers prevented sowing, localized calamities (hailstorm, landslide, inundation), mid-season adversity, and post-harvest cyclone damage.',
        amountOrValue: '100% Insured Sum',
        type: 'Insurance'
      },
      {
        title: 'Ultra-Low Subsidized Premium',
        description: 'Farmers pay only 1.5% for Rabi, 2.0% for Kharif crops; balance premium funded entirely by governments.',
        amountOrValue: 'Only 1.5% - 2% Premium',
        type: 'Subsidy'
      }
    ],
    documents: [
      {
        id: 'doc-aadhaar-pmfby',
        name: 'Aadhaar Card',
        description: 'Identity proof.',
        isMandatory: true,
        documentType: 'identity'
      },
      {
        id: 'doc-land-pmfby',
        name: 'Land Record (Khasra / Khatauni / 7-12) or Tenancy Agreement',
        description: 'Proving cultivation right on the insured plot.',
        isMandatory: true,
        documentType: 'other'
      },
      {
        id: 'doc-sowing-cert',
        name: 'Sowing Certificate / Self-Declaration',
        description: 'Issued by Patwari / Village Agriculture Assistant.',
        isMandatory: true,
        documentType: 'other'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Verify Crop Notification in your District',
        description: 'Check whether your crop (Paddy, Wheat, Cotton, Mustard, etc.) is notified in your Tehsil for current season.',
        actionUrl: 'https://pmfby.gov.in'
      },
      {
        stepNumber: 2,
        title: 'Enroll via Bank / CSC / Crop Insurance App',
        description: 'Submit land details, pay the small 1.5-2% premium online or via your Kisan Credit Card bank branch.',
        tips: 'Report localized crop damage within 72 hours via Crop Insurance App.'
      },
      {
        stepNumber: 3,
        title: 'Satellite & CCE Assessment & Claim Payout',
        description: 'Yield losses calculated using Crop Cutting Experiments (CCE) and satellite remote sensing; claims paid directly to bank.',
        actionUrl: 'https://pmfby.gov.in'
      }
    ],
    verification: {
      sourceDepartment: 'Department of Agriculture and Farmers Welfare',
      ministryOrAuthority: 'Ministry of Agriculture and Farmers Welfare, Govt of India',
      lastUpdated: '18 January 2025',
      officialPortalUrl: 'https://pmfby.gov.in',
      helpline: '14447 / 1800 180 1551',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 92,
    tags: ['agriculture', 'crop-insurance', 'farmers', 'risk-cover', 'kharif-rabi']
  },

  {
    id: 'haryana-chirayu-19',
    slug: 'haryana-chirayu-ayushman-scheme',
    name: 'Chirayu Haryana Comprehensive Health Scheme',
    shortName: 'Chirayu Haryana Health',
    tagline: 'Extended ₹5 Lakh cashless health cover for families with annual income up to ₹3 Lakh in Haryana.',
    category: 'Healthcare',
    level: 'State',
    coveredStates: ['Haryana'],
    shortDescription: 'State extension of Ayushman Bharat covering families having Parivar Pehchan Patra (PPP) verified annual income up to ₹3 Lakh.',
    detailedDescription: 'The Chirayu Haryana scheme extends the benefits of Ayushman Bharat to households in Haryana earning between ₹1.80 Lakh and ₹3.00 Lakh per annum on nominal nominal contribution of ₹1,500/year, providing ₹5 Lakh cashless inpatient hospital cover across all empaneled private and civil hospitals.',
    eligibility: {
      minAge: 0,
      maxAge: 100,
      allowedGenders: ['male', 'female', 'other', 'all'],
      allowedStates: ['Haryana'],
      allowedOccupations: ['Student', 'Farmer', 'Business owner', 'Employed', 'Unemployed', 'Self-employed', 'Homemaker', 'Retired', 'Other'],
      allowedCategories: ['All'],
      maxAnnualIncome: 300000,
      incomeRangesAllowed: ['Below ₹1 lakh', '₹1–2.5 lakh', '₹2.5–5 lakh'],
      customConditions: [
        'Permanent resident of Haryana with valid Parivar Pehchan Patra (PPP / Family ID)',
        'Annual household income verified in PPP database between ₹1.80 Lakh and ₹3.00 Lakh',
        'Nominal annual family contribution of ₹1,500 paid on Chirayu portal'
      ]
    },
    benefits: [
      {
        title: '₹5,00,000 Cashless Hospital Treatment',
        description: 'Identical treatment packages and hospital network as Ayushman Bharat PM-JAY.',
        amountOrValue: '₹5 Lakh / Year',
        type: 'Healthcare'
      }
    ],
    documents: [
      {
        id: 'doc-ppp-haryana',
        name: 'Haryana Parivar Pehchan Patra (PPP / Family ID)',
        description: 'Mandatory state resident identification card.',
        isMandatory: true,
        documentType: 'identity'
      },
      {
        id: 'doc-aadhaar-chirayu',
        name: 'Aadhaar Card of all family members',
        description: 'Linked with Parivar Pehchan Patra.',
        isMandatory: true,
        documentType: 'identity'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Check Family ID on Chirayu Portal',
        description: 'Visit chirayuayushmanharyana.in and enter your 8-digit Parivar Pehchan Patra (PPP) Family ID.',
        actionUrl: 'https://chirayuayushmanharyana.in'
      },
      {
        stepNumber: 2,
        title: 'Pay Annual Nominal Premium (₹1,500)',
        description: 'Complete online payment via UPI / NetBanking if income is between ₹1.8L and ₹3.0L (free if below ₹1.8L).',
        tips: 'Income verification status is pulled automatically from the state Citizen Resource Information Department (CRID).'
      },
      {
        stepNumber: 3,
        title: 'Download Chirayu Card',
        description: 'Generate your card and enjoy cashless hospitalization across 1,000+ empaneled hospitals in Haryana & NCR.',
        actionUrl: 'https://chirayuayushmanharyana.in'
      }
    ],
    verification: {
      sourceDepartment: 'Haryana Health Protection Authority',
      ministryOrAuthority: 'Government of Haryana',
      lastUpdated: '01 February 2025',
      officialPortalUrl: 'https://chirayuayushmanharyana.in',
      helpline: '1800 180 2002 / 104',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 89,
    tags: ['haryana', 'state-scheme', 'healthcare', 'ppp', 'chirayu', 'family']
  },

  {
    id: 'maharashtra-shikshan-shulka-20',
    slug: 'maharashtra-rajarshi-chhatrapati-shahu-maharaj-shikshan-shulk',
    name: 'Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Yojna',
    shortName: 'Maharashtra 50% Higher Ed Fee Waiver',
    tagline: '50% tuition and exam fee reimbursement for higher professional education in Maharashtra.',
    category: 'Education',
    level: 'State',
    coveredStates: ['Maharashtra'],
    shortDescription: 'Provides 50% waiver on tuition and examination fees for students from economically weaker and open/general categories pursuing professional degree courses.',
    detailedDescription: 'Under this Maharashtra state scheme (MahaDBT), students pursuing approved professional courses (Engineering, Medical, Pharmacy, MBA, Law, Agriculture) whose annual family income is up to ₹8 Lakh receive 50% reimbursement of tuition fees and exam fees.',
    eligibility: {
      minAge: 17,
      maxAge: 30,
      allowedGenders: ['male', 'female', 'other', 'all'],
      allowedStates: ['Maharashtra'],
      allowedOccupations: ['Student'],
      allowedCategories: ['General', 'EWS', 'OBC', 'All'],
      maxAnnualIncome: 800000,
      incomeRangesAllowed: ['Below ₹1 lakh', '₹1–2.5 lakh', '₹2.5–5 lakh', '₹5–10 lakh'],
      customConditions: [
        'Domicile of Maharashtra State',
        'Admitted through Centralized Admission Process (CAP) in approved degree/diploma college',
        'Family annual income must not exceed ₹8,00,000',
        'Maximum 2 children in the family eligible for this scheme'
      ]
    },
    benefits: [
      {
        title: '50% Tuition & Exam Fee Waiver',
        description: 'Direct 50% credit of official university fee directly to college on behalf of the student.',
        amountOrValue: '50% Course Fees',
        type: 'Scholarship'
      }
    ],
    documents: [
      {
        id: 'doc-domicile-mh',
        name: 'Maharashtra Domicile Certificate',
        description: 'Issued by Competent Sub-Divisional Officer / Tehsildar.',
        isMandatory: true,
        documentType: 'residence'
      },
      {
        id: 'doc-income-mh',
        name: 'Income Certificate (Up to ₹8 Lakh)',
        description: 'Issued by Tehsildar for current financial year.',
        isMandatory: true,
        documentType: 'income'
      },
      {
        id: 'doc-cap-allotment',
        name: 'CAP Allotment Letter & College Fee Receipt',
        description: 'Proving admission through centralized government merit process.',
        isMandatory: true,
        documentType: 'education'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Register on MahaDBT Portal',
        description: 'Create applicant account at mahadbt.maharashtra.gov.in using Aadhaar authentication.',
        actionUrl: 'https://mahadbt.maharashtra.gov.in'
      },
      {
        stepNumber: 2,
        title: 'Submit Application under Directorate of Higher Education (DHE)',
        description: 'Select Rajarshi Shahu Maharaj Scheme and upload CAP allotment, income certificate, and domicile.',
        tips: 'Keep scanned PDFs below 250KB.'
      },
      {
        stepNumber: 3,
        title: 'College & Joint Director Verification',
        description: 'College verifies student records and funds are credited directly to college/student account.',
        actionUrl: 'https://mahadbt.maharashtra.gov.in'
      }
    ],
    verification: {
      sourceDepartment: 'Directorate of Higher & Technical Education',
      ministryOrAuthority: 'Government of Maharashtra',
      lastUpdated: '12 January 2025',
      officialPortalUrl: 'https://mahadbt.maharashtra.gov.in',
      helpline: '022-49150800',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 89,
    tags: ['maharashtra', 'scholarship', 'engineering', 'medical', 'mahadbt', 'education']
  },

  {
    id: 'pm-divyang-21',
    slug: 'adip-scheme-for-persons-with-disabilities',
    name: 'ADIP Scheme (Assistance to Disabled Persons for Purchase/Fitting of Aids)',
    shortName: 'ADIP Divyang Assistance Scheme',
    tagline: '100% free high-end motorized tricycles, smart canes, hearing aids, and artificial limbs.',
    category: 'Social Security',
    level: 'Central',
    coveredStates: ['All India'],
    shortDescription: 'Provides modern, durable, sophisticated, and scientifically manufactured standard aids and assistive appliances to persons with disabilities (Divyangjan).',
    detailedDescription: 'The ADIP Scheme is implemented by the Ministry of Social Justice and Empowerment through ALIMCO and district disability rehabilitation centres to assist needy persons with disabilities in procuring durable, sophisticated and scientifically manufactured standard aids and assistive devices to promote physical, social, and psychological rehabilitation.',
    eligibility: {
      minAge: 0,
      maxAge: 90,
      allowedGenders: ['male', 'female', 'other', 'all'],
      allowedStates: ['All India'],
      allowedOccupations: ['Student', 'Farmer', 'Business owner', 'Employed', 'Unemployed', 'Self-employed', 'Homemaker', 'Retired', 'Other'],
      allowedCategories: ['All'],
      requiresDisability: true,
      maxAnnualIncome: 240000,
      incomeRangesAllowed: ['Below ₹1 lakh', '₹1–2.5 lakh'],
      customConditions: [
        'Holds a valid Disability Certificate / Unique Disability ID (UDID Card) with 40% or more benchmark disability',
        'Monthly income not exceeding ₹20,000 for 100% free aid (or up to ₹30,000 for 50% subsidy)',
        'Should not have received the same assistive aid from government/NGO sources in the last 3 years (1 year for children under 12)'
      ]
    },
    benefits: [
      {
        title: '100% Free Assistive Devices & Motorized Tri-wheelers',
        description: 'Free smart canes, motorized tricycles (for students/earning adults), daisy players, behind-the-ear digital hearing aids, and myoelectric limbs.',
        amountOrValue: '100% Free Devices',
        type: 'Equipment'
      }
    ],
    documents: [
      {
        id: 'doc-udid-card',
        name: 'UDID Card / Disability Certificate (40%+)',
        description: 'Issued by District Medical Board.',
        isMandatory: true,
        documentType: 'other'
      },
      {
        id: 'doc-income-adip',
        name: 'Income Certificate / BPL Card',
        description: 'Issued by MP/MLA/SDO/BDO/Tehsildar.',
        isMandatory: true,
        documentType: 'income'
      },
      {
        id: 'doc-aadhaar-adip',
        name: 'Aadhaar Card',
        description: 'Identity verification.',
        isMandatory: true,
        documentType: 'identity'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Obtain UDID Card on Swavlamban Portal',
        description: 'Ensure you have a digital Unique Disability ID (UDID) generated via swavlambancard.gov.in.',
        actionUrl: 'https://swavlambancard.gov.in'
      },
      {
        stepNumber: 2,
        title: 'Attend District ALIMCO Assessment Camp or Apply Online',
        description: 'Submit requirements through District Disability Rehabilitation Centre (DDRC) or at periodic ALIMCO mega distribution camps.',
        tips: 'Local Red Cross and District Social Welfare departments publish quarterly camp dates.'
      },
      {
        stepNumber: 3,
        title: 'Custom Measurement & Free Fitting',
        description: 'Receive custom fitted prosthetics or motorized devices with free lifetime warranty maintenance.',
        actionUrl: 'https://alimco.in'
      }
    ],
    verification: {
      sourceDepartment: 'Department of Empowerment of Persons with Disabilities (DEPwD) / ALIMCO',
      ministryOrAuthority: 'Ministry of Social Justice and Empowerment, Govt of India',
      lastUpdated: '19 January 2025',
      officialPortalUrl: 'https://alimco.in',
      helpline: '1800 180 5129',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 88,
    tags: ['disability', 'divyang', 'udid', 'assistive-devices', 'social-security', 'free-equipment']
  }
];
