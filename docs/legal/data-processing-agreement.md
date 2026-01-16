# Data Processing Agreement (DPA)

**Effective Date**: 1 January 2026  
**Last Updated**: 2 January 2026

---

## PARTIES

**DATA CONTROLLER** (You):  
Name: _[Your Agency/SubAccount Name]_  
Address: _[Your Registered Business Address]_  
SSM/BRN: _[Your Registration Number]_  
Email: _[Your Contact Email]_  
("Controller", "you", "your")

**DATA PROCESSOR** (Us):  
Automavy Dynamics (SSM 202403127995), trading as **Autlify**  
Address: No.9, Jalan Dua, 55200 Kuala Lumpur, Malaysia  
Email: contact@autlify.com  
Phone: +60 16-3234 178  
Data Protection Officer: Zayn Tan <zayn_tan@autlify.com>  
("Processor", "we", "us", "our")

---

## RECITALS

**WHEREAS:**

A. The Controller uses the Autlify Platform to manage agencies, sub-accounts, customer relationships, sales funnels, and payment processing.

B. In providing the Platform, the Processor processes personal data on behalf of the Controller.

C. Both parties are subject to the **Personal Data Protection Act 2010 (PDPA)** of Malaysia.

D. **PDPA Section 130** requires data processors to process personal data only on the instructions of the data controller.

E. This Data Processing Agreement ("DPA") establishes the rights and obligations of both parties regarding the processing of personal data.

**NOW THEREFORE**, in consideration of the mutual covenants and agreements, the parties agree as follows:

---

## 1. DEFINITIONS

### 1.1 Personal Data Protection Act Terms

- **Personal Data**: Information relating to an identified or identifiable individual (PDPA Section 4)
- **Processing**: Any operation performed on personal data, including collection, storage, use, disclosure, and deletion
- **Data Controller**: The party that determines the purposes and means of processing personal data
- **Data Processor**: The party that processes personal data on behalf of the data controller
- **Data Subject**: The individual to whom personal data relates
- **Sensitive Personal Data**: Personal data consisting of information regarding physical or mental health, political opinions, religious beliefs, or criminal offenses (PDPA Section 4)

### 1.2 Platform Terms

- **Platform**: The Autlify web application at autlify.com
- **Services**: All features provided by the Platform (funnel builder, CRM, payment processing, e-Invoice generation)
- **Agency**: A registered organization using the Platform
- **SubAccount**: A client account managed under an Agency
- **Contact**: An individual whose data is collected via funnel forms

---

## 2. SCOPE AND PURPOSE OF PROCESSING

### 2.1 Nature and Purpose of Processing

The Processor shall process personal data on behalf of the Controller for the following purposes:

1. **Account Management**: Creating and maintaining user accounts, agencies, and sub-accounts
2. **CRM Functionality**: Storing and managing contact information collected via sales funnels
3. **Payment Processing**: Facilitating payment transactions via Stripe Connect
4. **File Storage**: Storing logos, media files, and other user-uploaded content
5. **E-Invoice Generation**: Preparing and submitting e-Invoices to IRB Malaysia
6. **Communication**: Sending transactional emails (password resets, notifications)
7. **Service Delivery**: Providing all Platform features as described in the Terms of Service

### 2.2 Duration of Processing

Processing will continue for the **duration of the Controller's subscription** to the Platform, plus:
- **30 days** for data export and account closure
- **7 years** for invoice data (to comply with IRB Malaysia tax retention requirements)

### 2.3 Categories of Data Subjects

The Processor may process personal data relating to:

1. **Agency/SubAccount Users**: Employees, team members, administrators
2. **Contacts**: Individuals who submit information via funnel contact forms
3. **Customers**: Individuals who make purchases via Stripe Checkout
4. **Representatives**: Business representatives whose information is provided during registration (e.g., legal representatives, data protection officers)

---

## 3. CATEGORIES OF PERSONAL DATA PROCESSED

The Processor may process the following categories of personal data on behalf of the Controller:

### 3.1 User Account Data

- Full name
- Email address
- Password (encrypted with bcrypt)
- Phone number
- Profile avatar/photo
- User role and permissions
- Login timestamps and activity logs

### 3.2 Business Data

- Company name
- SSM/Business Registration Number
- Business entity type (Individual, Company, Non-Profit, Government)
- Registered business address (building, house number, street, city, state, country, postal code)
- Company email and phone number
- Company logo
- Tax identification information

### 3.3 Contact Data (from Funnel Forms)

- Name
- Email address
- Phone number (if provided)
- Any custom fields created by the Controller

### 3.4 Transaction Data

- Stripe Customer ID
- Stripe Connect Account ID
- Payment amounts and currency
- Transaction dates and statuses
- Invoice data (for IRBM submission)

### 3.5 Technical Data

- IP addresses
- Browser type and version
- Device identifiers
- Session cookies
- Usage analytics (pages visited, features used)

### 3.6 File Data

- Uploaded images (logos, media)
- File metadata (filename, size, upload date)

### 3.7 Sensitive Personal Data

**The Controller must NOT upload Sensitive Personal Data** to the Platform unless:
- Required by law
- The Controller has obtained explicit consent from data subjects
- The Controller has informed the Processor in writing

The Processor is **not liable** for unauthorized processing of Sensitive Personal Data uploaded by the Controller without notice.

---

## 4. PROCESSOR OBLIGATIONS (PDPA Section 130)

### 4.1 Processing Instructions

The Processor shall:
1. Process personal data **only on the documented instructions of the Controller** (this DPA and the Terms of Service constitute such instructions)
2. **Not** process personal data for any purpose other than providing the Platform Services
3. Notify the Controller immediately if any instruction violates PDPA or other applicable laws

### 4.2 Confidentiality

The Processor shall ensure that all persons authorized to process personal data:
1. Are subject to **confidentiality obligations** (contractual or statutory)
2. Receive appropriate **training** on data protection and security
3. Access personal data only as necessary to perform their duties

### 4.3 Security Measures (PDPA Section 7 - Security Principle)

The Processor shall implement appropriate technical and organizational measures to protect personal data against:
- Unauthorized access or disclosure
- Accidental loss or destruction
- Unlawful processing

**Technical Measures:**
- **Encryption in Transit**: TLS 1.3 for all data transmitted over the internet
- **Encryption at Rest**: AES-256 encryption for databases and file storage
- **Password Security**: Bcrypt hashing (12 rounds) for user passwords
- **Access Controls**: Role-based access controls (RBAC) to limit data access
- **Secure APIs**: Authentication required for all API endpoints
- **Vulnerability Scanning**: Regular security audits and penetration testing

**Organizational Measures:**
- **Data Minimization**: Collecting only necessary data
- **Audit Logs**: Logging all access to sensitive data
- **Incident Response Plan**: Procedures for detecting and responding to data breaches
- **Employee Training**: Annual data protection training for all staff
- **Vendor Management**: Ensuring sub-processors comply with security standards

### 4.4 Data Breach Notification (PDPA Section 16 - Notification of Data Breach)

In the event of a personal data breach:

1. The Processor shall notify the Controller **within 24 hours** of becoming aware of the breach
2. Notification shall include (to the extent known):
   - Nature of the breach (type of data affected, number of data subjects)
   - Likely consequences of the breach
   - Measures taken or proposed to mitigate harm
   - Contact details for further information

3. The Processor shall cooperate with the Controller to investigate the breach and implement corrective measures

4. The Controller is responsible for notifying affected data subjects and the PDPA Commissioner as required by PDPA Section 16

### 4.5 Assistance with Data Subject Requests

The Processor shall assist the Controller in responding to data subject requests under PDPA Section 5 (Access Principle):

**Right of Access (PDPA Section 30):**  
The Processor will provide the Controller with tools to export personal data in a structured format (CSV, JSON)

**Right of Correction (PDPA Section 34):**  
The Processor will enable the Controller to update or correct personal data via the Platform dashboard

**Right to Withdraw Consent (PDPA Section 38):**  
The Processor will delete personal data upon the Controller's instruction (subject to legal retention requirements)

**Right to Limit Processing (PDPA Section 40):**  
The Processor will restrict processing of specific data upon the Controller's instruction

**Response Time**: The Processor will respond to assistance requests within **5 business days**.

### 4.6 Assistance with Compliance Obligations

The Processor shall assist the Controller (at the Controller's cost) with:
1. **Data Protection Impact Assessments (DPIA)**: Providing information about processing activities
2. **PDPA Audits**: Allowing the Controller or authorized auditors to inspect the Processor's facilities and records (with reasonable notice)
3. **Documentation**: Providing records of processing activities as required by PDPA

---

## 5. SUB-PROCESSORS

### 5.1 Authorization to Use Sub-Processors

The Controller authorizes the Processor to engage the following sub-processors:

| Sub-Processor | Service | Location | Purpose |
|---------------|---------|----------|---------|
| Stripe, Inc. | Payment processing | Singapore, United States | Stripe Connect, Checkout, payouts |
| UploadThing | File storage | United States | Logo and media file storage |
| Microsoft Azure | Hosting | Subject to change | Application hosting and infrastructure |
| Prisma/Database Provider | Database | Subject to change | Structured data storage |
| Nodemailer + SMTP/Microsoft Graph API | Email | Varies by provider | Transactional emails |
| IRB Malaysia (Peppol Network) | Tax submission | Malaysia | E-Invoice submission (statutory requirement) |

### 5.2 Sub-Processor Obligations

The Processor shall ensure that all sub-processors:
1. Agree to the **same data protection obligations** as the Processor under this DPA
2. Implement appropriate **security measures** (as described in Section 4.3)
3. Allow **audits** by the Processor or the Controller

### 5.3 Liability for Sub-Processors

The Processor remains **fully liable** to the Controller for the performance of sub-processors.

### 5.4 Changes to Sub-Processors

The Processor may add or replace sub-processors with **30 days' written notice** to the Controller. If the Controller objects on reasonable data protection grounds, the Controller may:
1. Request alternative sub-processor arrangements, or
2. Terminate the subscription without penalty within the notice period

**Notice Method**: Email to the Controller's registered email address and in-app notification.

---

## 6. CROSS-BORDER DATA TRANSFERS (PDPA Section 129)

### 6.1 International Transfers

Personal data may be transferred to countries outside Malaysia as follows:

| Destination | Sub-Processor | Safeguards |
|-------------|---------------|------------|
| Singapore | Stripe, Inc. | Standard Contractual Clauses (SCCs), PCI-DSS compliance |
| United States | Stripe, Inc., UploadThing | Standard Contractual Clauses (SCCs) |
| Varies | Microsoft Azure, Database Provider | Microsoft Data Protection Addendum, SCCs |

### 6.2 Transfer Safeguards

The Processor ensures all cross-border transfers comply with PDPA Section 129 by implementing:
1. **Standard Contractual Clauses (SCCs)**: EU-approved SCCs or equivalent contractual safeguards
2. **Adequacy Decisions**: Transferring only to countries with adequate data protection laws
3. **Explicit Consent**: Obtaining the Controller's consent (this DPA constitutes such consent)

### 6.3 Controller Consent

By accepting this DPA, the Controller consents to cross-border transfers to the countries and sub-processors listed in Section 5.1, subject to the safeguards described above.

### 6.4 Statutory Transfers

Transfers to **IRB Malaysia** are exempt from PDPA Section 129 as they are required by Malaysian law (PDPA Section 44 - statutory disclosure exemption).

---

## 7. DATA RETENTION AND DELETION

### 7.1 Retention Period

The Processor shall retain personal data for the following periods:

| Data Type | Retention Period |
|-----------|------------------|
| Account and user data | Duration of subscription + 30 days (for export) |
| Transaction and invoice data | **7 years** (IRB Malaysia requirement) |
| Contact data (funnel forms) | Until account deletion or withdrawal of consent |
| Usage logs | 12 months |
| Security logs | 24 months |

### 7.2 Deletion Obligations

Upon the earlier of:
- Termination of the Controller's subscription
- The Controller's written deletion request
- Expiry of the retention period

The Processor shall **delete or anonymize all personal data**, except:
- Data required for legal compliance (7-year tax retention)
- Data the Controller explicitly requests to retain

### 7.3 Deletion Process

1. **30-Day Export Period**: The Controller has 30 days to export data after subscription cancellation
2. **Automated Deletion**: After 30 days, all non-retained data is automatically deleted from the Processor's systems
3. **Sub-Processor Deletion**: The Processor will instruct sub-processors (UploadThing, etc.) to delete data within 30 days
4. **Deletion Certificate**: Upon request, the Processor will provide written confirmation of deletion

### 7.4 Backup Retention

Deleted data may remain in backup systems for up to **90 days** for disaster recovery purposes. Backup data is not accessible for normal operations and is automatically overwritten after 90 days.

---

## 8. AUDITS AND INSPECTIONS

### 8.1 Audit Rights

The Controller (or an independent auditor appointed by the Controller) has the right to audit the Processor's compliance with this DPA, subject to:

1. **Notice**: At least **30 days' written notice** to the Processor
2. **Frequency**: No more than **once per year**, unless required by law or following a data breach
3. **Scope**: Audits limited to data protection and security measures relevant to the Controller's data
4. **Confidentiality**: Auditors must sign a confidentiality agreement
5. **Business Hours**: Audits conducted during normal business hours (9:00 AM - 6:00 PM MYT, Monday - Friday)

### 8.2 Audit Costs

The Controller shall bear all costs of audits, unless the audit reveals a **material breach** by the Processor, in which case the Processor shall reimburse reasonable audit costs.

### 8.3 Cooperation

The Processor shall:
1. Provide reasonable assistance and documentation
2. Allow access to relevant personnel and systems
3. Respond to audit findings within **14 days**

### 8.4 Third-Party Certifications

In lieu of an on-site audit, the Controller may accept third-party certifications or audit reports (e.g., SOC 2, ISO 27001) if the Processor obtains such certifications.

---

## 9. CONTROLLER OBLIGATIONS

### 9.1 Lawful Processing

The Controller represents and warrants that:
1. It has the **legal right** to collect and provide personal data to the Processor
2. It has obtained necessary **consents** or has other lawful bases for processing (PDPA Section 6)
3. It has provided **data subjects** with appropriate privacy notices (PDPA Section 7)

### 9.2 Data Accuracy

The Controller is responsible for ensuring personal data provided to the Processor is **accurate and up-to-date**. The Processor is not liable for decisions or actions based on inaccurate data.

### 9.3 Sensitive Personal Data

The Controller shall **not** upload Sensitive Personal Data to the Platform without:
1. Obtaining **explicit consent** from data subjects (PDPA Section 40)
2. Providing **written notice** to the Processor, including the nature of the sensitive data and legal basis for processing

### 9.4 Instructions

The Controller shall provide processing instructions that are:
1. **Lawful** under PDPA and other applicable laws
2. **Documented** in writing (email acceptable)
3. **Reasonable** within the scope of the Platform's capabilities

### 9.5 Data Subject Requests

The Controller is responsible for **responding to data subject requests** (access, correction, withdrawal of consent). The Processor will assist as described in Section 4.5.

---

## 10. LIABILITY AND INDEMNIFICATION

### 10.1 Mutual Indemnification

Each party shall indemnify and hold harmless the other party from any claims, damages, or losses arising from:
1. The indemnifying party's breach of this DPA
2. The indemnifying party's violation of PDPA
3. The indemnifying party's negligence or willful misconduct

### 10.2 Processor Liability

The Processor is liable for:
1. Data breaches caused by the Processor's failure to implement appropriate security measures
2. Unauthorized processing not instructed by the Controller
3. Failure to comply with PDPA Section 130 obligations

**Maximum Liability**: As set forth in the Terms of Service (Section 13 - Limitation of Liability)

### 10.3 Controller Liability

The Controller is liable for:
1. Providing unlawful processing instructions
2. Uploading Sensitive Personal Data without notice or consent
3. Failing to obtain necessary consents from data subjects

### 10.4 Exclusions

Neither party is liable for:
1. Sub-processor failures beyond the Processor's reasonable control (if the Processor has exercised due diligence in selecting and monitoring sub-processors)
2. Data breaches caused by the Controller's security failures (e.g., weak passwords, sharing login credentials)
3. Government actions or statutory disclosure requirements

---

## 11. TERM AND TERMINATION

### 11.1 Term

This DPA takes effect on the date the Controller accepts the Terms of Service and continues until:
- Termination of the Controller's subscription, or
- Termination of this DPA by either party

### 11.2 Termination Rights

Either party may terminate this DPA:
1. For **material breach** by the other party, if the breach is not cured within **30 days** of written notice
2. If required by **law or regulatory order**
3. Upon termination of the underlying subscription agreement

### 11.3 Effect of Termination

Upon termination of this DPA:
1. The Processor shall cease processing personal data (except for legal retention)
2. The Controller has **30 days** to export data
3. The Processor shall delete or return personal data as instructed by the Controller (subject to Section 7 retention requirements)
4. Sections that should survive (liability, confidentiality, governing law) remain in effect

---

## 12. GENERAL PROVISIONS

### 12.1 Governing Law

This DPA is governed by the **laws of Malaysia**. Any disputes arising from this DPA shall be resolved in the courts of **Kuala Lumpur, Malaysia**.

### 12.2 Regulatory Authority

The **Personal Data Protection Commissioner of Malaysia** is the supervisory authority for data protection matters under this DPA.

**Contact**:  
Website: http://www.pdp.gov.my  
Email: aduan@pdp.gov.my  
Phone: +603-8911 7000

### 12.3 Relationship to Terms of Service

This DPA supplements the [Terms of Service](./terms-of-service.md). In the event of conflict, this DPA prevails on data protection matters.

### 12.4 Amendments

This DPA may be amended:
1. By mutual written agreement of both parties, or
2. By the Processor with **30 days' notice**, to comply with changes in PDPA or other applicable laws

If the Controller objects to amendments, the Controller may terminate the subscription without penalty within the notice period.

### 12.5 Severability

If any provision of this DPA is found invalid or unenforceable, the remaining provisions remain in full force and effect.

### 12.6 Entire Agreement

This DPA, together with the Terms of Service and Privacy Policy, constitutes the entire agreement regarding data processing.

### 12.7 Language

In the event of conflict between the English version and any translation, the **English version prevails**.

---

## 13. SIGNATURES

By accepting the Terms of Service and using the Autlify Platform, the Controller agrees to be bound by this Data Processing Agreement.

**CONTROLLER:**

Name: _[Your Name]_  
Title: _[Your Title]_  
Date: _[Date of Acceptance]_  
Signature: _[Electronic acceptance via Platform]_

**PROCESSOR:**

**Automavy Dynamics** (SSM 202403127995), trading as **Autlify**

Name: Tan Eng Keat  
Title: Owner  
Date: 1 January 2026  
Email: contact@autlify.com

---

## 14. CONTACT INFORMATION

**For DPA-related inquiries:**

**Data Protection Officer (Processor)**:  
Zayn Tan  
Email: zayn_tan@autlify.com

**General Contact (Processor)**:  
Email: contact@autlify.com  
Phone: +60 16-3234 178

**Postal Address**:  
Automavy Dynamics  
No.9, Jalan Dua  
55200 Kuala Lumpur, Malaysia

---

**Last reviewed**: 2 January 2026  
**Effective Date**: 1 January 2026  
**Governing Law**: Personal Data Protection Act 2010 (Malaysia)

---

## ANNEX 1: DESCRIPTION OF PROCESSING ACTIVITIES

**Subject Matter**: Provision of agency management, CRM, funnel building, and payment processing services via the Autlify Platform

**Nature of Processing**: Collection, storage, use, disclosure, deletion of personal data

**Purpose of Processing**: Account management, CRM functionality, payment processing, file storage, e-Invoice generation, transactional communications

**Duration**: Duration of subscription + 30 days + 7 years for tax records

**Categories of Data Subjects**: Agency/SubAccount users, contacts (from funnel forms), customers (Stripe Checkout), business representatives

**Categories of Personal Data**: See Section 3 of this DPA

**Sensitive Personal Data**: Not permitted unless Controller provides written notice and obtains explicit consent

**Cross-Border Transfers**: Singapore, United States (see Section 6)

**Sub-Processors**: See Section 5.1

---

## ANNEX 2: SECURITY MEASURES

### Technical Measures

1. **Encryption**:
   - TLS 1.3 for data in transit
   - AES-256 for data at rest
   - Bcrypt (12 rounds) for passwords

2. **Access Controls**:
   - Role-based access controls (RBAC)
   - Multi-factor authentication (MFA) for admin accounts (coming soon)
   - Session timeout after 24 hours of inactivity

3. **Network Security**:
   - Firewalls and intrusion detection systems (IDS)
   - DDoS protection via hosting provider
   - Regular vulnerability scans

4. **Secure Development**:
   - Code reviews and static analysis
   - Dependency vulnerability scanning
   - Secure API authentication (OAuth 2.0, API keys)

### Organizational Measures

1. **Access Management**:
   - Principle of least privilege
   - Annual access reviews
   - Immediate revocation upon employee termination

2. **Training**:
   - Annual PDPA training for all employees
   - Security awareness training
   - Incident response drills

3. **Policies**:
   - Data protection policy
   - Incident response plan
   - Business continuity and disaster recovery plan

4. **Monitoring**:
   - Audit logs for all access to personal data
   - Automated alerts for suspicious activity
   - Regular security audits (quarterly)

### Physical Security (Hosting Providers)

- Restricted physical access to data centers
- Video surveillance and security personnel
- Environmental controls (fire suppression, cooling)
- Backup power supplies (UPS, generators)

---

**End of Data Processing Agreement**
