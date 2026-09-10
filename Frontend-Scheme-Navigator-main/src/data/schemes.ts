import { Scheme } from '../types';

export const SCHEMES_DATABASE: Scheme[] = [
  {
    id: 'pm-kisan-01',
    slug: 'pm-kisan-samman-nidhi',
    name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    shortName: 'PM-KISAN',
    tagline: 'Direct income support of ₹6,000 per year for all landholding farmer families across India.',
    category: 'Agriculture',
    level: 'Central',
    coveredStates: ['All India'],
    shortDescription: 'Provides ₹6,000 per year in three equal installments of ₹2,000 directly transferred into Aadhaar-seeded bank accounts of eligible farmer families.',
    detailedDescription: 'The Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) is a Central Sector scheme with 100% funding from the Government of India. Under the scheme, income support of ₹6,000/- per year in three equal installments is provided to all landholding farmer families, subject to certain exclusion criteria related to higher economic status. Funds are directly transferred to the bank accounts of the beneficiaries.',
    eligibility: {
      minAge: 18,
      maxAge: 75,
      allowedGenders: ['male', 'female', 'other', 'all'],
      allowedStates: ['All India'],
      allowedOccupations: ['Farmer', 'Self-employed'],
      allowedCategories: ['All'],
      maxAnnualIncome: 0,
      customConditions: [
        'Must hold cultivable agricultural land registered in applicant or family member name',
        'Not an institutional landholder or institutional tenant',
        'Not a former/current constitutional post holder, Minister, MP, MLA, or Mayor',
        'Not a serving or retired government officer/employee (excluding multi-tasking staff)',
        'Not an income tax payee in the last assessment year'
      ]
    },
    benefits: [
      {
        title: 'Direct Benefit Transfer',
        description: '₹6,000 per year paid in three 4-monthly installments of ₹2,000 directly to bank accounts.',
        amountOrValue: '₹6,000 / Year',
        type: 'Financial Assistance'
      },
      {
        title: 'Kisan Credit Card Linkage',
        description: 'Facilitates fast-track collateral-free credit at low subsidized interest rates (4%).',
        amountOrValue: 'Low Interest Credit',
        type: 'Loan & Credit'
      }
    ],
    documents: [
      {
        id: 'doc-aadhaar',
        name: 'Aadhaar Card',
        description: 'Mandatory Aadhaar card linked with active mobile number for biometric e-KYC.',
        isMandatory: true,
        documentType: 'identity'
      },
      {
        id: 'doc-land',
        name: 'Land Ownership Proof / Jamabandi / Khasra',
        description: 'Official revenue record proving cultivable land ownership title.',
        isMandatory: true,
        documentType: 'other'
      },
      {
        id: 'doc-bank',
        name: 'Aadhaar-Seeded Bank Passbook',
        description: 'Active savings account with NPCI Aadhaar mapping for direct benefit transfer.',
        isMandatory: true,
        documentType: 'bank'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Verify Land & Aadhaar Records',
        description: 'Ensure that the land mutation (Jamabandi/Khasra) is in your name and Aadhaar details match revenue records.',
        tips: 'Complete e-KYC on the portal using OTP or CSC biometric device.'
      },
      {
        stepNumber: 2,
        title: 'Access Farmers Corner on PM-KISAN Portal',
        description: 'Visit pmkisan.gov.in and select "New Farmer Registration" or visit the nearest Common Service Centre (CSC).',
        actionUrl: 'https://pmkisan.gov.in'
      },
      {
        stepNumber: 3,
        title: 'Submit Rural/Urban Form & Land Details',
        description: 'Fill in state, district, sub-district, village, survey number, and dag/khasra number.',
        tips: 'Double check IFSC code and Aadhaar number.'
      },
      {
        stepNumber: 4,
        title: 'State Nodal Verification & DBT Rollout',
        description: 'Your application is verified by the local patwari/revenue officer and approved for direct installment disbursement.',
        tips: 'Check payment status online using registered mobile or Aadhaar.'
      }
    ],
    verification: {
      sourceDepartment: 'Department of Agriculture & Farmers Welfare',
      ministryOrAuthority: 'Ministry of Agriculture and Farmers Welfare, Govt of India',
      lastUpdated: '15 January 2025',
      officialPortalUrl: 'https://pmkisan.gov.in',
      helpline: '155261 / 011-24300606',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 98,
    tags: ['agriculture', 'farmers', 'dbt', 'central', 'income-support']
  },

  {
    id: 'pm-mudra-02',
    slug: 'pradhan-mantri-mudra-yojana',
    name: 'Pradhan Mantri Mudra Yojana (PMMY)',
    shortName: 'PM Mudra Yojana',
    tagline: 'Collateral-free business loans up to ₹20 Lakh for non-corporate, non-farm micro and small enterprises.',
    category: 'Business',
    level: 'Central',
    coveredStates: ['All India'],
    shortDescription: 'Provides collateral-free institutional credit in three tiers: Shishu (up to ₹50k), Kishore (₹50k-₹5L), and Tarun (₹5L-₹20L) for micro entrepreneurs.',
    detailedDescription: 'Pradhan Mantri MUDRA Yojana (PMMY) is a flagship scheme launched by the Government of India to facilitate affordable micro-credit up to ₹20 Lakhs to non-corporate, non-farm small/micro enterprises. The loans are given by Commercial Banks, RRBs, Small Finance Banks, MFIs and NBFCs with guarantee coverage through CGFMU.',
    eligibility: {
      minAge: 18,
      maxAge: 65,
      allowedGenders: ['male', 'female', 'other', 'all'],
      allowedStates: ['All India'],
      allowedOccupations: ['Business owner', 'Self-employed', 'Unemployed', 'Farmer', 'Other'],
      allowedCategories: ['All'],
      customConditions: [
        'Non-corporate small business segment (proprietorship, partnership, small manufacturing, trading or service units)',
        'Applicant must not be a defaulter with any financial institution',
        'Viable business plan / project outline required for Kishore and Tarun loans'
      ]
    },
    benefits: [
      {
        title: 'Collateral-Free Loan',
        description: 'No collateral security or third-party guarantee required for loans up to ₹20 Lakh.',
        amountOrValue: 'Up to ₹20 Lakh',
        type: 'Loan & Credit'
      },
      {
        title: 'Mudra Debit Card',
        description: 'Working capital facility on a RuPay card to withdraw credit as needed and reduce interest expense.',
        amountOrValue: 'Overdraft / Card',
        type: 'Financial Assistance'
      }
    ],
    documents: [
      {
        id: 'doc-id',
        name: 'Identity & Address Proof',
        description: 'Aadhaar Card, Voter ID, Passport or Driving License.',
        isMandatory: true,
        documentType: 'identity'
      },
      {
        id: 'doc-business',
        name: 'Business Proof & Registration',
        description: 'Udyam Registration certificate, Shop & Establishment license, or GSTIN (if applicable).',
        isMandatory: true,
        documentType: 'business'
      },
      {
        id: 'doc-bank-stmt',
        name: 'Bank Statement',
        description: 'Last 6 months account statement of applicant or existing enterprise.',
        isMandatory: true,
        documentType: 'bank'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Choose Loan Category',
        description: 'Identify if you need Shishu (up to ₹50,000), Kishore (₹50,000 to ₹5 Lakh), or Tarun (up to ₹20 Lakh).',
        tips: 'Shishu requires minimal documentation and is ideal for hawkers and artisan units.'
      },
      {
        stepNumber: 2,
        title: 'Apply via JanSamarth or Preferred Bank',
        description: 'Submit your loan proposal online via jansamarth.in or visit your nearest public/private bank or MFI branch.',
        actionUrl: 'https://www.mudra.org.in'
      },
      {
        stepNumber: 3,
        title: 'Bank Appraisal & Sanction',
        description: 'The bank appraises creditworthiness and business viability without asking for collateral security.',
        tips: 'Keep quotation for machinery or raw materials handy if purchasing equipment.'
      }
    ],
    verification: {
      sourceDepartment: 'Department of Financial Services',
      ministryOrAuthority: 'Ministry of Finance, Govt of India',
      lastUpdated: '10 February 2025',
      officialPortalUrl: 'https://www.mudra.org.in',
      helpline: '1800 180 1111 / 1800 11 0001',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 95,
    tags: ['business', 'msme', 'loan', 'entrepreneurship', 'collateral-free']
  },

  {
    id: 'nsp-post-matric-03',
    slug: 'post-matric-scholarship-sc-obc-minority',
    name: 'Post-Matric Scholarship Scheme for Students',
    shortName: 'Post-Matric Scholarship',
    tagline: 'Full tuition fee reimbursement and monthly maintenance allowances for higher education.',
    category: 'Education',
    level: 'Central',
    coveredStates: ['All India'],
    shortDescription: 'Financial assistance for post-secondary education (Class 11 to PhD) covering mandatory non-refundable institutional fees and monthly living allowances.',
    detailedDescription: 'The Post Matric Scholarship is a centrally sponsored scheme aimed at providing financial support to students from economically disadvantaged backgrounds (SC, ST, OBC, EWS, Minority) studying at post-matriculation or post-secondary stages to enable them to complete their higher education without financial distress.',
    eligibility: {
      minAge: 15,
      maxAge: 32,
      allowedGenders: ['male', 'female', 'other', 'all'],
      allowedStates: ['All India'],
      allowedOccupations: ['Student'],
      allowedCategories: ['OBC', 'SC', 'ST', 'EWS', 'Minority'],
      maxAnnualIncome: 250000,
      incomeRangesAllowed: ['Below ₹1 lakh', '₹1–2.5 lakh'],
      customConditions: [
        'Enrolled in recognized government/aided or accredited private college, university or polytechnic',
        'Family annual income must not exceed ₹2.5 Lakh from all sources',
        'Not holding any other concurrent central government scholarship'
      ]
    },
    benefits: [
      {
        title: 'Full Tuition Fee Reimbursement',
        description: 'Direct payment of non-refundable tuition and institutional fees approved by state fee committee.',
        amountOrValue: '100% Course Fees',
        type: 'Scholarship'
      },
      {
        title: 'Monthly Maintenance Allowance',
        description: 'Monthly stipend of ₹300 to ₹1,350 per month based on course group (Engineering/Medical vs General).',
        amountOrValue: 'Up to ₹13,500/Year',
        type: 'Financial Assistance'
      }
    ],
    documents: [
      {
        id: 'doc-income-cert',
        name: 'Valid Income Certificate',
        description: 'Issued by designated state revenue authority (Tehsildar / SDO) for current financial year.',
        isMandatory: true,
        documentType: 'income'
      },
      {
        id: 'doc-caste-cert',
        name: 'Caste / Community Certificate',
        description: 'Authentic digital certificate proving SC/ST/OBC/EWS category.',
        isMandatory: true,
        documentType: 'caste'
      },
      {
        id: 'doc-marksheet',
        name: 'Previous Academic Marksheet & Fee Receipt',
        description: 'Class 10/12/Semester marksheet and current college admission fee receipt.',
        isMandatory: true,
        documentType: 'education'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Register on National Scholarship Portal (NSP)',
        description: 'Visit scholarships.gov.in and generate OTR (One Time Registration) using Aadhaar-linked mobile.',
        actionUrl: 'https://scholarships.gov.in'
      },
      {
        stepNumber: 2,
        title: 'Select Scheme & Upload Documents',
        description: 'Complete student academic details, college roll number, AISHE code, and upload income/caste certificates.',
        tips: 'Keep college AISHE / UDISE code ready from your administration office.'
      },
      {
        stepNumber: 3,
        title: 'Institute Level Verification',
        description: 'Your college Nodal Officer verifies your enrollment, attendance, and fee structure digitally on NSP portal.',
        tips: 'Notify your college scholarship cell right after online submission.'
      },
      {
        stepNumber: 4,
        title: 'State Approval & DBT Payment',
        description: 'District & State welfare departments release the funds directly to the Aadhaar-seeded bank account.',
        actionUrl: 'https://scholarships.gov.in'
      }
    ],
    verification: {
      sourceDepartment: 'Ministry of Social Justice and Empowerment / Tribal Affairs / Minority Affairs',
      ministryOrAuthority: 'Government of India',
      lastUpdated: '01 December 2024',
      officialPortalUrl: 'https://scholarships.gov.in',
      helpline: '0120-6619540',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 96,
    tags: ['education', 'scholarship', 'students', 'sc-st-obc', 'nsp', 'dbt']
  },

  {
    id: 'pm-ayushman-04',
    slug: 'ayushman-bharat-pmjay',
    name: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
    shortName: 'Ayushman Bharat (PM-JAY)',
    tagline: 'World\'s largest health insurance scheme giving ₹5 Lakh per family per year for secondary & tertiary hospital care.',
    category: 'Healthcare',
    level: 'Central',
    coveredStates: ['All India'],
    shortDescription: 'Free cashless and paperless hospitalization treatment up to ₹5,00,000 per family per year across 27,000+ empaneled public and private hospitals.',
    detailedDescription: 'Ayushman Bharat PM-JAY provides health assurance cover of ₹5 Lakh per family per year for secondary and tertiary healthcare hospitalizations. Over 12 crore poor and vulnerable families (approximately 55 crore beneficiaries) identified based on SECC 2011 data and expanded categories are eligible with zero restrictions on family size, age, or gender.',
    eligibility: {
      minAge: 0,
      maxAge: 100,
      allowedGenders: ['male', 'female', 'other', 'all'],
      allowedStates: ['All India'],
      allowedOccupations: ['Student', 'Farmer', 'Business owner', 'Employed', 'Unemployed', 'Self-employed', 'Homemaker', 'Retired', 'Other'],
      allowedCategories: ['All'],
      requiresBPL: true,
      customConditions: [
        'Family identified under SECC 2011 deprivation criteria or holds State NFSA Ration Card (BPL/Antyodaya)',
        'All citizens aged 70+ (Ayushman Senior Citizen extension) regardless of income ceiling',
        'No restriction on family size, age, or preexisting medical conditions'
      ]
    },
    benefits: [
      {
        title: '₹5,00,000 Cashless Health Cover',
        description: 'Covers pre-hospitalization, diagnostics, surgery, ICU, medicines, and 15 days post-hospitalization care.',
        amountOrValue: '₹5 Lakh / Family / Year',
        type: 'Healthcare'
      },
      {
        title: '2,000+ Medical & Surgical Packages',
        description: 'Includes cardiology, oncology, neurosurgery, orthopedics, burns, and pediatric treatments at network hospitals.',
        amountOrValue: 'Full Cashless Care',
        type: 'Insurance'
      }
    ],
    documents: [
      {
        id: 'doc-aadhaar-pmjay',
        name: 'Aadhaar Card',
        description: 'For biometric identification and Ayushman Card generation (e-KYC).',
        isMandatory: true,
        documentType: 'identity'
      },
      {
        id: 'doc-ration-card',
        name: 'Ration Card / PM-JAY Family ID',
        description: 'NFSA Ration Card or PM-JAY enumeration letter showing family members.',
        isMandatory: true,
        documentType: 'other'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Check Eligibility on Beneficiary Portal',
        description: 'Visit beneficiary.nha.gov.in or download Ayushman App and search by Mobile Number, Aadhaar, or Ration Card.',
        actionUrl: 'https://beneficiary.nha.gov.in'
      },
      {
        stepNumber: 2,
        title: 'Complete Biometric e-KYC',
        description: 'Authenticate via Face Auth on mobile app, Aadhaar OTP, or visit nearest Ayushman Mitra at empaneled hospital / CSC.',
        tips: 'Face authentication on the official Ayushman App works seamlessly without visiting an office.'
      },
      {
        stepNumber: 3,
        title: 'Download Ayushman Card (PVC/Digital)',
        description: 'Once verified, download your Ayushman Card instantly and present at any empaneled hospital for cashless treatment.',
        actionUrl: 'https://beneficiary.nha.gov.in'
      }
    ],
    verification: {
      sourceDepartment: 'National Health Authority (NHA)',
      ministryOrAuthority: 'Ministry of Health and Family Welfare, Govt of India',
      lastUpdated: '20 February 2025',
      officialPortalUrl: 'https://beneficiary.nha.gov.in',
      helpline: '14555 / 1800 111 565',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 99,
    tags: ['healthcare', 'insurance', 'cashless', 'hospital', 'family', 'senior-citizens']
  },

  {
    id: 'pm-awas-gramin-05',
    slug: 'pradhan-mantri-awas-yojana-gramin',
    name: 'Pradhan Mantri Awas Yojana - Gramin (PMAY-G)',
    shortName: 'PMAY Gramin',
    tagline: 'Financial assistance of up to ₹1.30 Lakh + 90 days MGNREGA wages for building a pucca house in rural India.',
    category: 'Housing',
    level: 'Central',
    coveredStates: ['All India'],
    shortDescription: 'Provides grant assistance of ₹1.20 Lakh in plains and ₹1.30 Lakh in hilly/difficult areas along with toilet construction grant for homeless rural families.',
    detailedDescription: 'Under PMAY-G, financial assistance is provided to eligible rural households living in kutcha or dilapidated houses for the construction of a quality pucca house with basic amenities including electricity, LPG connection, and toilet.',
    eligibility: {
      minAge: 18,
      maxAge: 85,
      allowedGenders: ['male', 'female', 'other', 'all'],
      allowedStates: ['All India'],
      allowedOccupations: ['Farmer', 'Unemployed', 'Self-employed', 'Homemaker', 'Other'],
      allowedCategories: ['All'],
      areaEligibility: ['Rural'],
      requiresBPL: true,
      customConditions: [
        'Houseless or living in kutcha/dilapidated house as per Awaas+ survey list',
        'Must not possess a motorized 2/3/4 wheeler or agricultural equipment',
        'Must not have a government employee or income tax payer in the family',
        'Must own land or have house-site allotted by Gram Panchayat'
      ]
    },
    benefits: [
      {
        title: 'Direct Construction Grant',
        description: '₹1.20 Lakh (Plain areas) or ₹1.30 Lakh (Hilly/NE/Integrated Action Plan areas) released in stages based on geotagged photo progress.',
        amountOrValue: 'Up to ₹1.30 Lakh',
        type: 'Housing'
      },
      {
        title: 'MGNREGA Wages + Swachh Bharat Toilet',
        description: '90-95 days of unskilled labor wages (~₹24,000) under MGNREGA plus ₹12,000 for toilet under SBM-G.',
        amountOrValue: '₹36,000+ Extra',
        type: 'Financial Assistance'
      }
    ],
    documents: [
      {
        id: 'doc-aadhaar-pmay',
        name: 'Aadhaar Card of all family members',
        description: 'Mandatory Aadhaar card for consent and authentication.',
        isMandatory: true,
        documentType: 'identity'
      },
      {
        id: 'doc-bank-pmay',
        name: 'Bank Account Details',
        description: 'Bank passbook copy of head of household (joint account with spouse preferred).',
        isMandatory: true,
        documentType: 'bank'
      },
      {
        id: 'doc-mgnrega-jobcard',
        name: 'MGNREGA Job Card',
        description: 'For linking wage entitlement during house construction.',
        isMandatory: false,
        documentType: 'other'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Inclusion in Gram Sabha Priority List',
        description: 'Verification of name in the Awaas+ list prepared by Ministry of Rural Development via Gram Sabha.',
        tips: 'Visit your Gram Rozgar Sevak or Panchayat Secretary to verify your inclusion.'
      },
      {
        stepNumber: 2,
        title: 'Geo-tagging of Existing Kutcha Site',
        description: 'Field officer captures geotagged photo of existing kutcha site using AwaasApp.',
        actionUrl: 'https://pmayg.nic.in'
      },
      {
        stepNumber: 3,
        title: 'Installment Disbursement with Stage Verification',
        description: 'Installments released directly to bank account at Plinth, Lintel, Roof, and Finishing levels upon photo verification.',
        tips: 'Always build the toilet simultaneously to claim SBM subsidy.'
      }
    ],
    verification: {
      sourceDepartment: 'Department of Rural Development',
      ministryOrAuthority: 'Ministry of Rural Development, Govt of India',
      lastUpdated: '18 January 2025',
      officialPortalUrl: 'https://pmayg.nic.in',
      helpline: '1800 11 6446',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 92,
    tags: ['housing', 'rural', 'pucca-house', 'pmay', 'gramin', 'bpl']
  },

  {
    id: 'pm-sukanya-06',
    slug: 'sukanya-samriddhi-yojana',
    name: 'Sukanya Samriddhi Yojana (SSY)',
    shortName: 'Sukanya Samriddhi Yojana',
    tagline: 'High-interest government-backed savings scheme for the education and marriage of the girl child.',
    category: 'Women & Child',
    level: 'Central',
    coveredStates: ['All India'],
    shortDescription: 'Attractive tax-free interest rate (currently 8.2% p.a.) with Section 80C tax deduction and maturity benefits for girl children below 10 years.',
    detailedDescription: 'Sukanya Samriddhi Account is a Government of India backed savings scheme targeted at the parents of girl children. The scheme encourages parents to build a fund for the future education and marriage expenses of their female child. Account can be opened from birth up to age 10 with minimum deposit of ₹250 per year.',
    eligibility: {
      minAge: 0,
      maxAge: 10,
      allowedGenders: ['female'],
      allowedStates: ['All India'],
      allowedOccupations: ['Student', 'Homemaker', 'Other'],
      allowedCategories: ['All'],
      customConditions: [
        'Girl child must be an Indian citizen under 10 years of age at the time of account opening',
        'Maximum 2 accounts permitted per family (except in case of twin/triplet girl children)',
        'Can be operated by legal guardian until the girl child reaches 18 years'
      ]
    },
    benefits: [
      {
        title: '8.2% Sovereign Guaranteed Interest',
        description: 'One of the highest interest rates among small savings schemes, compounded annually and backed by Govt of India.',
        amountOrValue: '8.2% P.A. Interest',
        type: 'Financial Assistance'
      },
      {
        title: 'Triple Tax Exemption (EEE)',
        description: 'Exemption at investment (Sec 80C), interest earned, and maturity withdrawal is completely 100% tax free.',
        amountOrValue: '100% Tax Free',
        type: 'Subsidy'
      }
    ],
    documents: [
      {
        id: 'doc-birth-cert',
        name: 'Birth Certificate of Girl Child',
        description: 'Issued by hospital, Municipal Corporation, or Registrar of Births.',
        isMandatory: true,
        documentType: 'identity'
      },
      {
        id: 'doc-guardian-id',
        name: 'Identity & Address Proof of Guardian',
        description: 'Aadhaar Card, PAN Card, or Passport of the parent/legal guardian.',
        isMandatory: true,
        documentType: 'identity'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Visit Post Office or Authorized Bank',
        description: 'Visit any India Post office branch or authorized public/private commercial bank (SBI, PNB, HDFC, ICICI, etc.).',
        actionUrl: 'https://www.indiapost.gov.in'
      },
      {
        stepNumber: 2,
        title: 'Fill SSY Account Opening Form (Form-1)',
        description: 'Attach birth certificate of the girl child and guardian KYC documents with initial minimum deposit of ₹250.',
        tips: 'You can deposit anywhere between ₹250 to ₹1,50,000 per financial year.'
      },
      {
        stepNumber: 3,
        title: 'Receive SSY Passbook',
        description: 'A dedicated passbook is issued recording all deposits, annual interest credit, and maturity calculation.',
        tips: 'Online IPPB app allows easy monthly net-banking deposits from home.'
      }
    ],
    verification: {
      sourceDepartment: 'Department of Economic Affairs / Department of Posts',
      ministryOrAuthority: 'Ministry of Finance & Ministry of Communications, Govt of India',
      lastUpdated: '01 January 2025',
      officialPortalUrl: 'https://www.indiapost.gov.in',
      helpline: '1800 266 6868',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 94,
    tags: ['women', 'girl-child', 'savings', 'education', 'tax-saving', 'high-interest']
  },

  {
    id: 'pm-standup-07',
    slug: 'stand-up-india-scheme',
    name: 'Stand-Up India Scheme for Women & SC/ST Entrepreneurs',
    shortName: 'Stand-Up India',
    tagline: 'Bank loans between ₹10 Lakh and ₹1 Crore for setting up greenfield enterprises.',
    category: 'Business',
    level: 'Central',
    coveredStates: ['All India'],
    shortDescription: 'Promotes entrepreneurship among women and SC/ST communities by facilitating bank loans between ₹10 Lakh and ₹1 Crore to at least one SC/ST and one woman borrower per bank branch.',
    detailedDescription: 'The Stand-Up India scheme facilitates bank loans between ₹10 lakh and ₹1 crore to at least one Scheduled Caste (SC) or Scheduled Tribe (ST) borrower and at least one woman borrower per bank branch for setting up a greenfield enterprise in manufacturing, services, agri-allied activities, or the trading sector.',
    eligibility: {
      minAge: 18,
      maxAge: 70,
      allowedGenders: ['female', 'male', 'other', 'all'],
      allowedStates: ['All India'],
      allowedOccupations: ['Business owner', 'Self-employed', 'Unemployed', 'Other'],
      allowedCategories: ['SC', 'ST', 'All'],
      customConditions: [
        'Applicant must be either a Woman or belong to SC/ST category',
        'Enterprise must be a Greenfield venture (first time venture of the beneficiary)',
        'In case of non-individual enterprises, at least 51% shareholding and controlling stake must be held by SC/ST or Woman',
        'Borrower should not be in default to any bank or financial institution'
      ]
    },
    benefits: [
      {
        title: 'Greenfield Project Financing',
        description: 'Composite loan (term loan + working capital) covering up to 85% of project cost between ₹10 Lakh and ₹1 Crore.',
        amountOrValue: '₹10L – ₹1 Crore',
        type: 'Loan & Credit'
      },
      {
        title: 'Credit Guarantee & Handholding Support',
        description: 'Backed by Credit Guarantee Fund for Stand-Up India (CGFSI) and handholding by SIDBI and NABARD.',
        amountOrValue: 'Guaranteed Credit',
        type: 'Financial Assistance'
      }
    ],
    documents: [
      {
        id: 'doc-identity-standup',
        name: 'Aadhaar / Voter ID / Passport',
        description: 'Proof of identity and address.',
        isMandatory: true,
        documentType: 'identity'
      },
      {
        id: 'doc-caste-standup',
        name: 'Caste Certificate (for SC/ST applicants)',
        description: 'Valid certificate issued by competent revenue authority (not required for general women).',
        isMandatory: false,
        documentType: 'caste'
      },
      {
        id: 'doc-project-report',
        name: 'Detailed Project Report (DPR)',
        description: 'Project proposal including manufacturing/service cost, raw material, projected cash flow, and market feasibility.',
        isMandatory: true,
        documentType: 'business'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Prepare Detailed Project Report (DPR)',
        description: 'Draft your business model, capital expenditure, machinery cost, and working capital needs.',
        tips: 'Take assistance from SIDBI handholding agencies listed on the portal.'
      },
      {
        stepNumber: 2,
        title: 'Apply on Stand-Up India Portal',
        description: 'Register at standupmitra.in and submit your online application along with preferred bank branches.',
        actionUrl: 'https://www.standupmitra.in'
      },
      {
        stepNumber: 3,
        title: 'Bank Sanction & Margin Money Support',
        description: 'Lead District Manager (LDM) coordinates with the bank branch for project evaluation and sanction.',
        tips: 'Margin money requirement is only 15% which can be converged with eligible state subsidy schemes.'
      }
    ],
    verification: {
      sourceDepartment: 'Department of Financial Services / SIDBI',
      ministryOrAuthority: 'Ministry of Finance, Govt of India',
      lastUpdated: '12 January 2025',
      officialPortalUrl: 'https://www.standupmitra.in',
      helpline: '1800 180 1111',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 89,
    tags: ['business', 'women', 'sc-st', 'startup', 'loans', 'greenfield']
  },

  {
    id: 'pm-pmkvy-08',
    slug: 'pradhan-mantri-kaushal-vikas-yojana',
    name: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)',
    shortName: 'PMKVY 4.0',
    tagline: 'Free industry-aligned skill certification, on-the-job training, and placement support for youth.',
    category: 'Skill Development',
    level: 'Central',
    coveredStates: ['All India'],
    shortDescription: 'Free skill training in high-growth sectors (Industry 4.0, AI, Robotics, Mechatronics, Solar, Healthcare, Drone technology) with stipend and NSDC certificate.',
    detailedDescription: 'PMKVY 4.0 is the flagship scheme of the Ministry of Skill Development and Entrepreneurship (MSDE) implemented by NSDC. It aims to empower Indian youth with industry-relevant, future-ready skills to enable them to secure better livelihood and wage/self-employment opportunities.',
    eligibility: {
      minAge: 15,
      maxAge: 45,
      allowedGenders: ['male', 'female', 'other', 'all'],
      allowedStates: ['All India'],
      allowedOccupations: ['Student', 'Unemployed', 'Self-employed', 'Other'],
      allowedCategories: ['All'],
      customConditions: [
        'Indian citizen with valid Aadhaar and bank account',
        'School/college dropouts or unemployed youth seeking vocational employment',
        'Basic educational qualification as specified in respective National Occupational Standards (NOS) job role'
      ]
    },
    benefits: [
      {
        title: '100% Free Training & Certification',
        description: 'All course tuition, assessment, and NSDC certification fees fully sponsored by Government of India.',
        amountOrValue: '100% Free Course',
        type: 'Skill Training'
      },
      {
        title: 'Training Stipend & Toolkit Support',
        description: 'Direct cash stipend for conveyance, boarding assistance, and free digital toolkits on completion.',
        amountOrValue: 'Stipend + Toolkit',
        type: 'Financial Assistance'
      }
    ],
    documents: [
      {
        id: 'doc-aadhaar-pmkvy',
        name: 'Aadhaar Card',
        description: 'For biometric attendance and Skill India Digital hub registration.',
        isMandatory: true,
        documentType: 'identity'
      },
      {
        id: 'doc-edu-pmkvy',
        name: 'Educational Qualification Proof',
        description: 'Marksheet of 8th / 10th / 12th / ITI / Diploma as per chosen job role.',
        isMandatory: true,
        documentType: 'education'
      },
      {
        id: 'doc-bank-pmkvy',
        name: 'Bank Passbook Copy',
        description: 'For direct disbursement of candidate conveyance stipend.',
        isMandatory: true,
        documentType: 'bank'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Register on Skill India Digital Portal',
        description: 'Create your learner profile on skillindiadigital.gov.in using your mobile and Aadhaar.',
        actionUrl: 'https://www.skillindiadigital.gov.in'
      },
      {
        stepNumber: 2,
        title: 'Search Job Roles & Training Centres',
        description: 'Browse nearby Pradhan Mantri Kaushal Kendras (PMKK) or accredited ITIs and choose desired course (e.g., Drone Tech, EV Maintenance).',
        tips: 'Filter courses by "Placement Linked" for highest job matching.'
      },
      {
        stepNumber: 3,
        title: 'Undergo Training & Sector Skill Council Exam',
        description: 'Attend classes, complete practical lab projects, pass third-party assessment, and receive government certification.',
        actionUrl: 'https://www.skillindiadigital.gov.in'
      }
    ],
    verification: {
      sourceDepartment: 'National Skill Development Corporation (NSDC)',
      ministryOrAuthority: 'Ministry of Skill Development and Entrepreneurship, Govt of India',
      lastUpdated: '05 February 2025',
      officialPortalUrl: 'https://www.skillindiadigital.gov.in',
      helpline: '08800055555 / 1800 123 9626',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 91,
    tags: ['skill-development', 'youth', 'training', 'jobs', 'nsdc', 'certification']
  },

  {
    id: 'atal-pension-09',
    slug: 'atal-pension-yojana',
    name: 'Atal Pension Yojana (APY)',
    shortName: 'Atal Pension Yojana',
    tagline: 'Guaranteed monthly pension of ₹1,000 to ₹5,000 per month from age 60 for unorganized sector workers.',
    category: 'Social Security',
    level: 'Central',
    coveredStates: ['All India'],
    shortDescription: 'Government-backed pension scheme guaranteeing fixed monthly pensions of ₹1,000, ₹2,000, ₹3,000, ₹4,000, or ₹5,000 per month to subscribers after 60 years of age.',
    detailedDescription: 'Atal Pension Yojana (APY) focuses on all citizens in the unorganized sector. Administered by PFRDA through NPS architecture, it guarantees a fixed pension ranging from ₹1,000 to ₹5,000 per month depending on contribution amount and entry age.',
    eligibility: {
      minAge: 18,
      maxAge: 40,
      allowedGenders: ['male', 'female', 'other', 'all'],
      allowedStates: ['All India'],
      allowedOccupations: ['Farmer', 'Unemployed', 'Self-employed', 'Homemaker', 'Employed', 'Other'],
      allowedCategories: ['All'],
      customConditions: [
        'Indian citizen between 18 and 40 years of age with a savings bank or post office account',
        'Must contribute regularly for a minimum period of 20 years until reaching age 60',
        'Must not be an income tax payer as per rules effective October 2022'
      ]
    },
    benefits: [
      {
        title: 'Guaranteed Monthly Pension for Life',
        description: 'Fixed pension of ₹1,000, ₹2,000, ₹3,000, ₹4,000, or ₹5,000 every month starting at 60 years.',
        amountOrValue: 'Up to ₹5,000 / Month',
        type: 'Pension'
      },
      {
        title: 'Spouse Pension & Nominee Corpus',
        description: 'Same pension amount continues to spouse after subscriber\'s demise; accumulated corpus (~₹8.5 Lakh for ₹5k pension) returned to nominee.',
        amountOrValue: '₹8.5L Nominee Corpus',
        type: 'Social Security'
      }
    ],
    documents: [
      {
        id: 'doc-aadhaar-apy',
        name: 'Aadhaar Card',
        description: 'For identification and subscriber PRAN registration.',
        isMandatory: true,
        documentType: 'identity'
      },
      {
        id: 'doc-bank-apy',
        name: 'Savings Bank Account with Auto-Debit Mandate',
        description: 'Bank passbook copy showing active auto-debit consent for monthly/quarterly contribution.',
        isMandatory: true,
        documentType: 'bank'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Choose Desired Monthly Pension',
        description: 'Decide whether you want ₹1,000 or up to ₹5,000 per month. Entry at age 18 requires just ₹210/month for ₹5,000 pension.',
        tips: 'Joining earlier in life significantly lowers the required monthly contribution.'
      },
      {
        stepNumber: 2,
        title: 'Submit APY Subscriber Form at Bank / NetBanking',
        description: 'Fill the APY form online via mobile banking (SBI, PNB, Canara, Post Office) or submit physical form at branch.',
        actionUrl: 'https://www.npscra.nsdl.co.in'
      },
      {
        stepNumber: 3,
        title: 'PRAN Generation & Auto-Debit Activation',
        description: 'Your Permanent Retirement Account Number (PRAN) is generated and monthly auto-debit is activated.',
        tips: 'Ensure sufficient balance in your bank account on scheduled auto-debit date to avoid penalty of ₹1/month.'
      }
    ],
    verification: {
      sourceDepartment: 'Pension Fund Regulatory and Development Authority (PFRDA)',
      ministryOrAuthority: 'Ministry of Finance, Govt of India',
      lastUpdated: '14 January 2025',
      officialPortalUrl: 'https://www.pfrda.org.in',
      helpline: '1800 110 069',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 93,
    tags: ['pension', 'social-security', 'unorganized-sector', 'savings', 'retirement']
  },

  {
    id: 'pm-kusum-10',
    slug: 'pm-kusum-solar-pump-scheme',
    name: 'PM-KUSUM (Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan)',
    shortName: 'PM-KUSUM Solar Scheme',
    tagline: 'Up to 60% capital subsidy for installing solar agricultural water pumps and solarizing grid-connected pumps.',
    category: 'Agriculture',
    level: 'Central',
    coveredStates: ['All India'],
    shortDescription: 'Subsidizes standalone solar agriculture pumps and enables farmers to sell surplus solar power back to DISCOMs for additional regular income.',
    detailedDescription: 'PM-KUSUM consists of three components: Component A (setting up 10,000 MW decentralized ground mounted grid connected solar power plants), Component B (installation of 20 lakh standalone solar agriculture pumps with 60% subsidy), and Component C (solarization of 15 lakh grid connected agriculture pumps).',
    eligibility: {
      minAge: 18,
      maxAge: 75,
      allowedGenders: ['male', 'female', 'other', 'all'],
      allowedStates: ['All India'],
      allowedOccupations: ['Farmer', 'Self-employed'],
      allowedCategories: ['All'],
      customConditions: [
        'Individual farmers, Farmer Producer Organizations (FPOs), Cooperatives, and Water User Associations',
        'Must possess agricultural land with existing borewell or water source for irrigation',
        'Must not have received similar solar pump capital subsidy under state schemes within past 5 years'
      ]
    },
    benefits: [
      {
        title: '60% Capital Subsidy',
        description: '30% Central Financial Assistance (CFA) + 30% State Government subsidy; farmer pays only 10% upfront, remaining 30% available via bank loan.',
        amountOrValue: '60% Subsidy',
        type: 'Subsidy'
      },
      {
        title: 'Zero Electricity Bills + Surplus Power Income',
        description: 'Eliminates diesel fuel costs and provides daylight reliable irrigation plus income from DISCOM feed-in tariff.',
        amountOrValue: 'Daytime Free Power',
        type: 'Equipment'
      }
    ],
    documents: [
      {
        id: 'doc-aadhaar-kusum',
        name: 'Aadhaar Card',
        description: 'Proof of applicant identity.',
        isMandatory: true,
        documentType: 'identity'
      },
      {
        id: 'doc-land-kusum',
        name: 'Agricultural Land Title / 7/12 / Jamabandi',
        description: 'Proving ownership of farm where solar pump will be erected.',
        isMandatory: true,
        documentType: 'other'
      },
      {
        id: 'doc-bank-kusum',
        name: 'Bank Account Details',
        description: 'For direct subsidy linkage and bank loan convergence.',
        isMandatory: true,
        documentType: 'bank'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Check State Renewable Energy Agency Portal',
        description: 'PM-KUSUM Component B & C are implemented via state nodal agencies (e.g., MEDA in Maharashtra, HAREDA in Haryana, RRECL in Rajasthan).',
        actionUrl: 'https://pmkusum.mnre.gov.in'
      },
      {
        stepNumber: 2,
        title: 'Register & Select Pump Capacity (3HP / 5HP / 7.5HP)',
        description: 'Submit online application with borewell depth and water requirement to receive quota allotment.',
        tips: 'Apply early as state targets operate on a first-come-first-served basis during annual subsidy windows.'
      },
      {
        stepNumber: 3,
        title: 'Pay Farmer Share & Site Inspection',
        description: 'Empaneled vendor visits site, installs solar panels, pump controller, and motor with 5-year comprehensive warranty.',
        actionUrl: 'https://pmkusum.mnre.gov.in'
      }
    ],
    verification: {
      sourceDepartment: 'Ministry of New and Renewable Energy (MNRE)',
      ministryOrAuthority: 'Government of India',
      lastUpdated: '08 February 2025',
      officialPortalUrl: 'https://pmkusum.mnre.gov.in',
      helpline: '1800 180 3333',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 90,
    tags: ['agriculture', 'solar', 'pumps', 'subsidy', 'farmers', 'clean-energy']
  },

  {
    id: 'pmegp-11',
    slug: 'prime-minister-employment-generation-programme',
    name: 'Prime Minister\'s Employment Generation Programme (PMEGP)',
    shortName: 'PMEGP',
    tagline: 'Credit-linked capital subsidy up to 35% on project costs up to ₹50 Lakh for new manufacturing & service units.',
    category: 'Employment',
    level: 'Central',
    coveredStates: ['All India'],
    shortDescription: 'Generates self-employment opportunities through establishment of micro-enterprises in non-farm sectors with government margin money subsidy up to 35%.',
    detailedDescription: 'PMEGP is a major credit-linked subsidy programme aimed at generating self-employment opportunities through establishment of micro-enterprises. Maximum project cost is ₹50 Lakh for manufacturing sector and ₹20 Lakh for service/business sector with subsidy ranging from 15% to 35%.',
    eligibility: {
      minAge: 18,
      maxAge: 65,
      allowedGenders: ['male', 'female', 'other', 'all'],
      allowedStates: ['All India'],
      allowedOccupations: ['Unemployed', 'Self-employed', 'Business owner', 'Student', 'Other'],
      allowedCategories: ['All'],
      customConditions: [
        'Any individual above 18 years of age (at least VIII pass for projects above ₹10L in manufacturing / ₹5L in service)',
        'Only newly set-up projects are eligible (existing units are not eligible under standard track)',
        'Self Help Groups (SHGs), Institutions registered under Societies Registration Act are also eligible'
      ]
    },
    benefits: [
      {
        title: '15% to 35% Margin Money Subsidy',
        description: 'General category: 15% (Urban) / 25% (Rural). Special category (SC/ST/OBC/Women/Ex-Servicemen/Differently-abled): 25% (Urban) / 35% (Rural).',
        amountOrValue: 'Up to 35% Subsidy',
        type: 'Subsidy'
      },
      {
        title: 'Substantial Project Financing',
        description: 'Bank finances remaining 90-95% of total project cost (up to ₹50 Lakh for manufacturing and ₹20 Lakh for service units).',
        amountOrValue: 'Up to ₹50 Lakh',
        type: 'Loan & Credit'
      }
    ],
    documents: [
      {
        id: 'doc-aadhaar-pmegp',
        name: 'Aadhaar Card & Passport Photo',
        description: 'Identity verification.',
        isMandatory: true,
        documentType: 'identity'
      },
      {
        id: 'doc-edu-pmegp',
        name: 'Educational Qualification Marksheet (Class 8+)',
        description: 'Mandatory if project cost exceeds ₹10 Lakh (mfg) or ₹5 Lakh (service).',
        isMandatory: true,
        documentType: 'education'
      },
      {
        id: 'doc-dpr-pmegp',
        name: 'Detailed Project Report (DPR) & Quotations',
        description: 'Breakdown of machinery, equipment, raw material, and working capital requirement.',
        isMandatory: true,
        documentType: 'business'
      },
      {
        id: 'doc-caste-pmegp',
        name: 'Special Category Certificate (if claiming 35% subsidy)',
        description: 'SC/ST/OBC/Disability certificate or Rural area certificate.',
        isMandatory: false,
        documentType: 'caste'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Prepare Project Profile & DPR',
        description: 'Draft the project financial projections or download sample model project profiles available on KVIC portal.',
        actionUrl: 'https://www.kviconline.gov.in/pmegpeportal'
      },
      {
        stepNumber: 2,
        title: 'Submit Online Application via KVIC PMEGP Portal',
        description: 'Select implementing agency (KVIC, KVIB, or DIC) and your preferred financing bank branch.',
        tips: 'Rural applicants receive higher subsidy (35% vs 25%). Select Rural if project is located in Gram Panchayat area.'
      },
      {
        stepNumber: 3,
        title: 'District Level Task Force Committee (DLTFC) Review',
        description: 'DLTFC scrutinizes proposal, interviews applicant, and forwards approved cases to bank for sanction.',
        actionUrl: 'https://www.kviconline.gov.in/pmegpeportal'
      },
      {
        stepNumber: 4,
        title: 'Complete EDP Training & Subsidy Lock-in',
        description: 'Complete 5-10 day online Entrepreneurship Development Programme (EDP) training before subsidy disbursement.',
        tips: 'EDP training can be completed 100% online through KVIC e-learning portal.'
      }
    ],
    verification: {
      sourceDepartment: 'Khadi and Village Industries Commission (KVIC)',
      ministryOrAuthority: 'Ministry of Micro, Small and Medium Enterprises, Govt of India',
      lastUpdated: '22 January 2025',
      officialPortalUrl: 'https://www.kviconline.gov.in/pmegpeportal',
      helpline: '1800 180 6763 / 022-26711000',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 94,
    tags: ['business', 'subsidy', 'employment', 'msme', 'kvic', 'manufacturing']
  },

  {
    id: 'pm-vishwakarma-12',
    slug: 'pm-vishwakarma-scheme',
    name: 'PM Vishwakarma Scheme for Traditional Artisans & Craftspeople',
    shortName: 'PM Vishwakarma',
    tagline: 'Collateral-free enterprise loans up to ₹3 Lakh at 5% interest + ₹15,000 toolkit incentive for 18 traditional trades.',
    category: 'Skill Development',
    level: 'Central',
    coveredStates: ['All India'],
    shortDescription: 'Comprehensive end-to-end support for traditional artisans (carpenters, blacksmiths, potters, cobblers, tailors, etc.) including skill upgradation, ₹15,000 toolkit grant, and subsidized credit.',
    detailedDescription: 'PM Vishwakarma provides end-to-end holistic support to artisans and craftspeople who work with their hands and tools across 18 identified traditional trades. Benefits include recognition via PM Vishwakarma Certificate & ID Card, skill verification, basic & advanced training with ₹500/day stipend, ₹15,000 modern toolkit grant, and collateral-free enterprise development loans up to ₹3 Lakh at a concessional interest rate of 5%.',
    eligibility: {
      minAge: 18,
      maxAge: 70,
      allowedGenders: ['male', 'female', 'other', 'all'],
      allowedStates: ['All India'],
      allowedOccupations: ['Self-employed', 'Unemployed', 'Homemaker', 'Other'],
      allowedCategories: ['All'],
      customConditions: [
        'Artisan or craftsperson working with hands and tools in one of 18 trades (Carpenter, Blacksmith, Potter, Sculptor, Cobbler, Mason, Basket/Mat weaver, Toy maker, Barber, Garland maker, Washerman, Tailor, Fishing net maker, etc.)',
        'Should not have availed loans under PMEGP, PM Mudra, or PM SVANidhi in the past 5 years',
        'Registration is restricted to one member per family'
      ]
    },
    benefits: [
      {
        title: '₹15,000 Toolkit E-Voucher Grant',
        description: 'Direct digital e-voucher worth ₹15,000 to purchase modern customized toolkits for your craft.',
        amountOrValue: '₹15,000 Grant',
        type: 'Equipment'
      },
      {
        title: 'Collateral-Free Concessional Loan',
        description: 'First tranche up to ₹1 Lakh (18 months) and second tranche up to ₹2 Lakh (30 months) at just 5% fixed interest.',
        amountOrValue: 'Up to ₹3 Lakh @ 5%',
        type: 'Loan & Credit'
      },
      {
        title: 'Skill Training with Daily Stipend',
        description: '5-7 days basic skill verification and 15+ days advanced training with ₹500 daily stipend.',
        amountOrValue: '₹500 / Day Stipend',
        type: 'Skill Training'
      }
    ],
    documents: [
      {
        id: 'doc-aadhaar-vishwakarma',
        name: 'Aadhaar Card linked to Mobile',
        description: 'Biometric authentication for registration.',
        isMandatory: true,
        documentType: 'identity'
      },
      {
        id: 'doc-bank-vishwakarma',
        name: 'Bank Passbook Copy',
        description: 'For stipend and toolkit e-voucher disbursement.',
        isMandatory: true,
        documentType: 'bank'
      },
      {
        id: 'doc-ration-vishwakarma',
        name: 'Ration Card / Family Proof',
        description: 'To ensure one registration per family.',
        isMandatory: true,
        documentType: 'other'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Visit Nearest Common Service Centre (CSC)',
        description: 'Enrollment is carried out free of cost through biometric e-KYC at CSC centers nationwide.',
        actionUrl: 'https://pmvishwakarma.gov.in'
      },
      {
        stepNumber: 2,
        title: 'Panchayat & Urban Local Body Verification',
        description: 'Gram Panchayat Pradhan or Executive Officer of Municipality verifies that applicant practices the traditional trade.',
        tips: 'Bring sample photos or proof of your artisan work.'
      },
      {
        stepNumber: 3,
        title: 'Skill Training, Toolkit Voucher & Loan Access',
        description: 'Complete basic training, collect ₹15,000 toolkit voucher, and apply for 5% enterprise loan.',
        actionUrl: 'https://pmvishwakarma.gov.in'
      }
    ],
    verification: {
      sourceDepartment: 'Ministry of MSME & Ministry of Skill Development',
      ministryOrAuthority: 'Government of India',
      lastUpdated: '16 February 2025',
      officialPortalUrl: 'https://pmvishwakarma.gov.in',
      helpline: '1800 267 7777 / 011-23061500',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 97,
    tags: ['artisans', 'crafts', 'toolkit', 'subsidy', 'training', 'vishwakarma']
  },

  {
    id: 'pm-matru-vandana-13',
    slug: 'pradhan-mantri-matru-vandana-yojana',
    name: 'Pradhan Mantri Matru Vandana Yojana (PMMVY)',
    shortName: 'PMMVY Maternity Benefit',
    tagline: 'Maternity cash incentive of ₹5,000 for first child and ₹6,000 for second girl child directly to mothers.',
    category: 'Women & Child',
    level: 'Central',
    coveredStates: ['All India'],
    shortDescription: 'Provides partial wage compensation and nutrition support for pregnant and lactating mothers transferred directly into Aadhaar-seeded accounts.',
    detailedDescription: 'PMMVY provides cash incentives to pregnant women and lactating mothers for wage loss compensation during pregnancy and child care, and promotes health-seeking behavior including ANC registration, institutional delivery, and child vaccination.',
    eligibility: {
      minAge: 19,
      maxAge: 45,
      allowedGenders: ['female'],
      allowedStates: ['All India'],
      allowedOccupations: ['Homemaker', 'Self-employed', 'Unemployed', 'Farmer', 'Other'],
      allowedCategories: ['All'],
      customConditions: [
        'Pregnant women and lactating mothers (PW&LM) who are not in regular employment with Central/State Govt or PSUs',
        'First live birth receives ₹5,000 in two installments',
        'Second live birth receives ₹6,000 in single installment if the newborn is a girl child'
      ]
    },
    benefits: [
      {
        title: 'Direct Cash Assistance',
        description: '₹5,000 for first child in 2 installments (₹3,000 at ANC registration + ₹2,000 at child birth & vaccination) and ₹6,000 for second girl child.',
        amountOrValue: 'Up to ₹6,000',
        type: 'Financial Assistance'
      }
    ],
    documents: [
      {
        id: 'doc-mcp-card',
        name: 'Mother & Child Protection (MCP) Card',
        description: 'Issued by Anganwadi worker / ANM during early ANC checkup.',
        isMandatory: true,
        documentType: 'other'
      },
      {
        id: 'doc-aadhaar-pmmvy',
        name: 'Aadhaar Card of Mother & Husband',
        description: 'Identity verification.',
        isMandatory: true,
        documentType: 'identity'
      },
      {
        id: 'doc-bank-pmmvy',
        name: 'Aadhaar Linked Bank Account of Mother',
        description: 'Direct Benefit Transfer account passbook.',
        isMandatory: true,
        documentType: 'bank'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Register Pregnancy at Anganwadi Centre / Health Sub-Centre',
        description: 'Obtain your MCP card and register within 570 days from Last Menstrual Period (LMP) date.',
        actionUrl: 'https://pmmvy.wcd.gov.in'
      },
      {
        stepNumber: 2,
        title: 'Submit Online / Anganwadi Application Form',
        description: 'Anganwadi worker or citizen can self-apply directly on the PMMVY citizen portal (pmmvy.wcd.gov.in).',
        tips: 'Ensure your bank account is active and seeded with Aadhaar on NPCI mapper.'
      },
      {
        stepNumber: 3,
        title: 'Direct DBT Installment Release',
        description: 'Funds are transferred automatically via PFMS directly to the mother\'s bank account.',
        actionUrl: 'https://pmmvy.wcd.gov.in'
      }
    ],
    verification: {
      sourceDepartment: 'Ministry of Women and Child Development',
      ministryOrAuthority: 'Government of India',
      lastUpdated: '11 January 2025',
      officialPortalUrl: 'https://pmmvy.wcd.gov.in',
      helpline: '011-23382393 / 1098',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 90,
    tags: ['women', 'maternity', 'child-welfare', 'dbt', 'nutrition']
  },

  {
    id: 'ignops-pension-14',
    slug: 'indira-gandhi-national-old-age-pension-scheme',
    name: 'Indira Gandhi National Old Age Pension Scheme (IGNOAPS)',
    shortName: 'National Old Age Pension',
    tagline: 'Monthly pension for senior citizens aged 60+ belonging to BPL households.',
    category: 'Social Security',
    level: 'Central',
    coveredStates: ['All India'],
    shortDescription: 'Guaranteed social security monthly stipend funded jointly by Central and State Governments for impoverished senior citizens living below poverty line.',
    detailedDescription: 'Under IGNOAPS (National Social Assistance Programme), central assistance of ₹200 to ₹500 per month is provided, with state governments contributing matching or higher top-up pensions (resulting in total monthly pensions of ₹1,000 to ₹3,000 depending on state policies) to elderly persons belonging to BPL families.',
    eligibility: {
      minAge: 60,
      maxAge: 105,
      allowedGenders: ['male', 'female', 'other', 'all'],
      allowedStates: ['All India'],
      allowedOccupations: ['Retired', 'Unemployed', 'Homemaker', 'Other'],
      allowedCategories: ['All'],
      requiresBPL: true,
      incomeRangesAllowed: ['Below ₹1 lakh'],
      customConditions: [
        'Applicant must be aged 60 years or above',
        'Must belong to a household living below the poverty line (BPL) as verified by local revenue authority',
        'Should not be in receipt of any other regular government or private employee pension'
      ]
    },
    benefits: [
      {
        title: 'Monthly Cash Pension',
        description: 'Combined Central + State monthly pension of ₹1,000 to ₹3,000 credited on the 1st of every month.',
        amountOrValue: '₹1,000–₹3,000/Month',
        type: 'Pension'
      }
    ],
    documents: [
      {
        id: 'doc-age-pension',
        name: 'Age Proof (Aadhaar / Voter ID / Birth Certificate)',
        description: 'Proving age of 60 years or higher.',
        isMandatory: true,
        documentType: 'identity'
      },
      {
        id: 'doc-bpl-pension',
        name: 'BPL Ration Card or Income Certificate',
        description: 'Issued by Block Development Officer (BDO) or Tehsildar.',
        isMandatory: true,
        documentType: 'income'
      },
      {
        id: 'doc-bank-pension',
        name: 'Bank / Post Office Passbook',
        description: 'For direct monthly pension credit.',
        isMandatory: true,
        documentType: 'bank'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Obtain NSAP Application Form',
        description: 'Download online from nsap.nic.in or collect from your local Block Development Office (BDO) or Municipality.',
        actionUrl: 'https://nsap.nic.in'
      },
      {
        stepNumber: 2,
        title: 'Submit Form with Age & BPL Proof',
        description: 'Submit to the Social Welfare Officer / BDO office along with bank passbook and Aadhaar.',
        tips: 'Physical verification is completed by Panchayat / Ward committee within 30 days.'
      },
      {
        stepNumber: 3,
        title: 'Monthly Direct Pension Disbursement',
        description: 'Upon sanction, pension starts disbursing directly to bank or post office account.',
        actionUrl: 'https://nsap.nic.in'
      }
    ],
    verification: {
      sourceDepartment: 'Department of Rural Development / Social Welfare',
      ministryOrAuthority: 'Ministry of Rural Development, Govt of India',
      lastUpdated: '05 January 2025',
      officialPortalUrl: 'https://nsap.nic.in',
      helpline: '1800 111 555',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 88,
    tags: ['seniors', 'pension', 'social-security', 'bpl', 'nsap']
  },

  {
    id: 'naps-apprenticeship-15',
    slug: 'national-apprenticeship-promotion-scheme',
    name: 'National Apprenticeship Promotion Scheme (NAPS-2)',
    shortName: 'NAPS Apprenticeship',
    tagline: 'Direct monthly stipend support up to ₹1,500 + industry on-the-job training for students & graduates.',
    category: 'Employment',
    level: 'Central',
    coveredStates: ['All India'],
    shortDescription: 'Promotes industry-embedded apprenticeship training across ITI, Diploma, and Degree graduates with government co-funded monthly stipend.',
    detailedDescription: 'Under NAPS-2, the Government of India provides financial support to establishments undertaking apprenticeship programmes by directly transferring 25% of the prescribed stipend (up to a maximum of ₹1,500 per month per apprentice) to the bank account of the apprentice through DBT.',
    eligibility: {
      minAge: 14,
      maxAge: 35,
      allowedGenders: ['male', 'female', 'other', 'all'],
      allowedStates: ['All India'],
      allowedOccupations: ['Student', 'Unemployed', 'Other'],
      allowedCategories: ['All'],
      customConditions: [
        'Candidates who have passed 5th, 8th, 10th, 12th, ITI, Diploma, or Graduate degree',
        'Must possess active candidate profile on the National Apprenticeship portal',
        'Must not have undergone prior apprenticeship training in the same trade'
      ]
    },
    benefits: [
      {
        title: 'Direct Monthly Stipend',
        description: 'Monthly stipend of ₹7,000 to ₹15,000 (including ₹1,500 direct government DBT share) paid during 6-24 months of on-job training.',
        amountOrValue: '₹7k–₹15k / Month',
        type: 'Financial Assistance'
      },
      {
        title: 'National Apprenticeship Certificate (NAC)',
        description: 'Nationally recognized qualification by NCVET boosting permanent corporate and PSU employment prospects.',
        amountOrValue: 'Govt Certificate',
        type: 'Skill Training'
      }
    ],
    documents: [
      {
        id: 'doc-aadhaar-naps',
        name: 'Aadhaar Card',
        description: 'For e-KYC on apprenticeship portal.',
        isMandatory: true,
        documentType: 'identity'
      },
      {
        id: 'doc-marksheet-naps',
        name: 'Educational Certificates & Marksheets',
        description: '10th / 12th / ITI / Polytechnic / Degree marksheets.',
        isMandatory: true,
        documentType: 'education'
      },
      {
        id: 'doc-bank-naps',
        name: 'Bank Account Details',
        description: 'Aadhaar seeded account for monthly DBT stipend.',
        isMandatory: true,
        documentType: 'bank'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Register on Apprenticeship Portal',
        description: 'Visit apprenticeshipindia.gov.in and complete your profile, educational history, and resume.',
        actionUrl: 'https://www.apprenticeshipindia.gov.in'
      },
      {
        stepNumber: 2,
        title: 'Search & Apply for Opportunities',
        description: 'Filter thousands of active vacancies across Tata Motors, L&T, Railways, BHEL, and top private corporations.',
        tips: 'Apply to multiple companies within your home district and state for faster selection.'
      },
      {
        stepNumber: 3,
        title: 'Sign Apprenticeship Contract & Start Training',
        description: 'Accept digital offer letter, sign tripartite contract, and receive monthly stipend directly.',
        actionUrl: 'https://www.apprenticeshipindia.gov.in'
      }
    ],
    verification: {
      sourceDepartment: 'Directorate General of Training (DGT)',
      ministryOrAuthority: 'Ministry of Skill Development and Entrepreneurship, Govt of India',
      lastUpdated: '10 January 2025',
      officialPortalUrl: 'https://www.apprenticeshipindia.gov.in',
      helpline: '011-23748250',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 91,
    tags: ['apprenticeship', 'jobs', 'stipend', 'graduates', 'iti', 'students']
  },

  {
    id: 'pm-pmjay-senior-16',
    slug: 'ayushman-vaya-vandana-senior-citizens',
    name: 'Ayushman Bharat Vaya Vandana Card (For All 70+ Seniors)',
    shortName: 'Ayushman 70+ Seniors Card',
    tagline: 'Distinct ₹5 Lakh annual cashless healthcare cover for ALL citizens aged 70 and above, regardless of income.',
    category: 'Healthcare',
    level: 'Central',
    coveredStates: ['All India'],
    shortDescription: 'Universal health coverage offering dedicated ₹5 Lakh per year health assurance exclusively for all citizens aged 70 years and above irrespective of economic background.',
    detailedDescription: 'Launched under the expanded Ayushman Bharat framework, the Ayushman Vaya Vandana card offers universal ₹5 Lakh annual top-up health insurance coverage to every Indian citizen aged 70 years or above on an individual basis, completely independent of household income or existing family PM-JAY cards.',
    eligibility: {
      minAge: 70,
      maxAge: 110,
      allowedGenders: ['male', 'female', 'other', 'all'],
      allowedStates: ['All India'],
      allowedOccupations: ['Retired', 'Homemaker', 'Farmer', 'Employed', 'Self-employed', 'Other'],
      allowedCategories: ['All'],
      customConditions: [
        'Indian citizen who has attained 70 years of age or older as per Aadhaar record',
        'No income ceiling or wealth exclusion criteria (accessible to all economic strata)',
        'Eligible even if the family already holds an existing Ayushman Bharat card (gives separate ₹5L cover)'
      ]
    },
    benefits: [
      {
        title: '₹5 Lakh Dedicated Annual Hospital Cover',
        description: 'Comprehensive cashless in-patient treatment at 29,000+ empaneled private and government hospitals nationwide.',
        amountOrValue: '₹5 Lakh / Person / Year',
        type: 'Healthcare'
      }
    ],
    documents: [
      {
        id: 'doc-aadhaar-senior',
        name: 'Aadhaar Card with correct Date of Birth',
        description: 'Aadhaar is the only mandatory document required.',
        isMandatory: true,
        documentType: 'identity'
      }
    ],
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Download Ayushman App or Visit Portal',
        description: 'Access beneficiary.nha.gov.in or install the official Ayushman App on your smartphone.',
        actionUrl: 'https://beneficiary.nha.gov.in'
      },
      {
        stepNumber: 2,
        title: 'Select "70+ Senior Citizen Registration"',
        description: 'Enter Aadhaar number and authenticate using Face ID or mobile OTP.',
        tips: 'Ensure the applicant\'s mobile number is linked with Aadhaar.'
      },
      {
        stepNumber: 3,
        title: 'Instant Card Download',
        description: 'Your distinct yellow Ayushman Vaya Vandana Card is generated instantly for cashless hospital visits.',
        actionUrl: 'https://beneficiary.nha.gov.in'
      }
    ],
    verification: {
      sourceDepartment: 'National Health Authority',
      ministryOrAuthority: 'Ministry of Health and Family Welfare, Govt of India',
      lastUpdated: '14 February 2025',
      officialPortalUrl: 'https://beneficiary.nha.gov.in',
      helpline: '14555',
      isOfficialVerified: true,
      demoDataNotice: true
    },
    popularScore: 98,
    tags: ['healthcare', 'seniors', '70-plus', 'cashless', 'universal-health']
  }
];
