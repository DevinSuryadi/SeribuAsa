# Functional Requirements - NutriGuard

**Version**: 1.0.0  
**Last Updated**: 2025-03-05  
**Status**: Draft  
**Author**: Product Team

---
---

## 1. Introduction

### 1.1 Purpose of Document

This document defines the functional requirements for the NutriGuard E-Voucher platform. It serves as the primary reference for development, testing, and stakeholder communication regarding what the system must do to achieve its business objectives.

### 1.2 Scope of Requirements

This document covers:
- All user-facing functionality for 6 user roles
- Backend system requirements
- Integration requirements with external services
- Data management requirements
- Security and compliance requirements

**Out of Scope:**
- Specific UI/UX design details (see UX specifications)
- Technical implementation details (see System Architecture)
- Performance requirements (see Non-Functional Requirements)
- Deployment procedures (see Deployment Guide)

### 1.4 Target Audience

- **Product Owners**: Understanding feature scope and priority
- **Developers**: Implementing features correctly
- **QA Engineers**: Creating comprehensive test cases
- **Designers**: Designing user interfaces
- **Stakeholders**: Understanding system capabilities

### 1.5 Definitions & Acronyms

| Term | Definition |
|------|------------|
| **E-Voucher** | Electronic voucher for purchasing nutrition products |
| **FIES** | Food Insecurity Experience Scale (FAO 8-question survey) |
| **WHO** | World Health Organization (growth standards) |
| **RLS** | Row-Level Security (PostgreSQL) |
| **JWT** | JSON Web Token (authentication) |
| **CSR** | Corporate Social Responsibility |
| **Z-Score** | Standard score for child growth assessment |
| **HAZ** | Height-for-Age Z-Score |
| **WAZ** | Weight-for-Age Z-Score |
| **WHZ** | Weight-for-Height Z-Score |

---

## 2. User Roles & Personas

### 2.1 Overview

NutriGuard supports 6 user roles, each with distinct responsibilities, permissions, and workflows. Users may have multiple roles (e.g., a user can be both a donor and a beneficiary).

| Role | Description | Primary Actions | Access Level |
|------|-------------|-----------------|--------------|
| **Donor** | Individual contributor | Donate, manage subscriptions, view impact | Private |
| **Corporate Donor** | Company CSR program | Bulk donations, manage CSR budget, reporting | Private |
| **Beneficiary** | Food aid recipient | Redeem vouchers, complete surveys, monitor nutrition | Private |
| **Vendor** | Product seller | Manage products, process redemptions, request settlements | Private |
| **Admin** | Platform administrator | Verify users, approve vendors/products, manage system | Full access |
| **Government** | Government official | View analytics, export reports, monitor programs | Read-only |

---

### 2.2 Donor Persona

**Role Description:**
Individual donors are motivated by social impact and want to contribute to fighting food insecurity through monetary donations.

**Primary Responsibilities:**
- Choose donation amounts and plans
- Select donation frequency (one-time or recurring)
- Specify allocation preferences (geographic, beneficiary types)
- Monitor impact of contributions
- Access tax receipts and donation history

**Key Permissions:**
- `donations:create` - Create new donations
- `donations:view` - View donation history
- `donations:update` - Modify subscriptions
- `impact:view` - View impact dashboard
- `receipts:download` - Download tax receipts

**Access Level:**
- Can only view their own donation data
- Cannot view other donors' information
- Can view aggregated impact statistics

**Typical User Journey:**
1. Register account → Choose "donor" role
2. Browse donation plans → Select amount and frequency
3. Complete payment → Receive confirmation
4. View impact dashboard → Track voucher redemptions
5. Manage subscription → Pause, resume, or upgrade

**Pain Points Addressed:**
- Uncertainty about where donation goes
- Difficulty tracking impact over time
- Lack of personalized giving experience
- No tax documentation process

---

### 2.3 Corporate Donor Persona

**Role Description:**
Corporate entities fulfilling CSR objectives through structured food aid programs with larger budgets and reporting requirements.

**Primary Responsibilities:**
- Establish recurring corporate donation programs
- Allocate CSR budget to specific initiatives
- Track impact reporting for stakeholders
- Manage multiple donation allocations
- Generate CSR compliance reports

**Key Permissions:**
- `donations:create` - Create corporate donations
- `donations:manage` - Manage all corporate donations
- `impact:view` - View detailed impact reports
- `reports:export` - Export CSR reports
- `budget:allocate` - Allocate budget across initiatives

**Access Level:**
- Can view all donations made by the company
- Cannot view other companies' data
- Can view aggregated industry statistics

**Typical User Journey:**
1. Company registration → Upload business documents
2. Verification → Admin approval
3. Allocate CSR budget → Choose initiatives and amounts
4. Monitor program → Track beneficiaries supported
5. Generate reports → Share with stakeholders

**Pain Points Addressed:**
- Complexity of CSR program management
- Difficulty measuring social impact
- Need for transparent reporting to stakeholders
- Administrative burden of traditional donations

---

### 2.4 Beneficiary Persona

**Role Description:**
Individuals and families experiencing food insecurity who receive nutritional assistance through E-Vouchers.

**Primary Responsibilities:**
- Complete FIES survey to determine eligibility and need level
- Use vouchers to purchase approved nutrition products
- Provide nutrition data for children (growth monitoring)
- Maintain accurate contact and demographic information

**Key Permissions:**
- `vouchers:view` - View voucher balance and transactions
- `vouchers:redeem` - Redeem vouchers at checkout
- `products:view` - Browse product catalog
- `orders:create` - Create orders
- `surveys:complete` - Complete FIES surveys
- `nutrition:track` - Track child growth data

**Access Level:**
- Can only view their own voucher data
- Cannot view other beneficiaries' information
- Can view educational nutrition content

**Typical User Journey:**
1. Registration → Submit documents (KTP, KK)
2. Verification → Admin approval
3. Complete FIES survey → Determine need level
4. Receive vouchers → Allocated based on survey results
5. Browse catalog → Select nutrition products
6. Checkout → Apply voucher and complete order
7. Receive products → From local vendor
8. Repeat → Monthly survey and voucher renewal

**Pain Points Addressed:**
- Dignity in food selection (choice vs. handouts)
- Accessibility (no need to travel to distribution points)
- Nutritional appropriateness (personalized recommendations)
- Flexibility (use vouchers when needed)

---

### 2.5 Vendor Persona

**Role Description:**
Local businesses (grocery stores, minimarkets, food retailers) that accept NutriGuard E-Vouchers as payment.

**Primary Responsibilities:**
- Register and get verified on platform
- Add products to catalog with nutrition information
- Process voucher redemptions at checkout
- Request settlement payments from platform

**Key Permissions:**
- `products:create` - Add new products to catalog
- `products:update` - Edit product information
- `products:delete` - Remove products
- `orders:view` - View orders from platform
- `orders:process` - Process voucher redemptions
- `settlements:request` - Request settlement withdrawals
- `settlements:view` - View settlement history

**Access Level:**
- Can only view their own product and order data
- Cannot view other vendors' data
- Can view platform-wide product categories

**Typical User Journey:**
1. Business registration → Upload business license
2. Verification → Admin approval
3. Add products → List inventory with nutrition info
4. Receive orders → From beneficiaries
5. Process redemption → Validate voucher and deliver
6. Request settlement → Withdraw earnings (7-day minimum)
7. Receive payment → Within 2-3 business days

**Pain Points Addressed:**
- Difficulty accessing government aid programs
- Unpredictable cash flow
- Limited customer base
- Administrative burden of reporting

---

### 2.6 Admin Persona

**Role Description:**
Platform administrators responsible for system operations, user management, and ensuring platform integrity.

**Primary Responsibilities:**
- Verify and approve new users (vendors, government officials)
- Approve products and vendors
- Monitor transactions for fraud/anomalies
- Batch allocate vouchers to beneficiaries
- Configure system settings and parameters
- Resolve user issues and disputes

**Key Permissions:**
- `users:verify` - Verify user registrations
- `users:manage` - Manage all user accounts
- `vendors:approve` - Approve/reject vendor applications
- `products:approve` - Approve/reject product listings
- `vouchers:allocate` - Batch allocate vouchers
- `vouchers:revoke` - Revoke vouchers if needed
- `orders:view` - View all orders
- `settlements:approve` - Approve settlement requests
- `system:configure` - Configure system settings
- `analytics:view` - View full platform analytics
- `reports:generate` - Generate any report

**Access Level:**
- Full read and write access to all system data
- Can impersonate users for troubleshooting
- Can view all transactions and activities

**Typical User Journey:**
1. Dashboard overview → Review system statistics
2. User verification → Review pending registrations
3. Product approval → Review new product submissions
4. Fraud monitoring → Review suspicious activities
5. Voucher allocation → Batch allocate to verified beneficiaries
6. Settlement approval → Review and approve vendor payouts
7. System configuration → Update platform settings

**Pain Points Addressed:**
- Manual verification processes
- Difficulty tracking fraud patterns
- Inefficient user management
- Lack of real-time monitoring

---

### 2.7 Government Persona

**Role Description:**
Government agency representatives who monitor food security initiatives, allocate resources, and make policy decisions.

**Primary Responsibilities:**
- View national and regional food security statistics
- Analyze beneficiary demographics and needs
- Monitor program effectiveness and impact
- Allocate government funding to specific initiatives
- Generate reports for policy making

**Key Permissions:**
- `analytics:view` - View all analytics
- `analytics:export` - Export analytics data
- `reports:generate` - Generate government reports
- `programs:monitor` - Monitor government programs
- `data:analyze` - Analyze food security trends

**Access Level:**
- Read-only access to aggregated data
- Cannot view individual beneficiary data (privacy)
- Can view aggregated statistics by region

**Typical User Journey:**
1. Login → Access government dashboard
2. National overview → View country-wide statistics
3. Regional drill-down → Analyze province/district data
4. Program monitoring → Track government-funded initiatives
5. Export reports → Download for policy analysis
6. Identify gaps -> Determine areas needing intervention

**Pain Points Addressed:**
- Fragmented data across multiple programs
- Difficulty measuring real-time impact
- Lack of standardized metrics
- Inefficient reporting processes

---

## 3. Functional Requirements by Module

### 3.1 Authentication & User Management

This module covers user registration, authentication, profile management, and role management.

---

#### FR-AM-001: User Registration

**Priority**: High  
**Status**: Draft

**Description**:
Users can register for a NutriGuard account by providing email, password, and selecting their primary role. Registration requires email verification before the account becomes active.

**User Story**:
As a new user, I want to register with my email and choose my role, so that I can start using the platform as a donor, beneficiary, or vendor.

**Acceptance Criteria**:
- [x] User can register with email, password, full name, and role selection
- [x] Password must meet security requirements (min 8 characters, 1 uppercase, 1 number)
- [x] Email validation checks for valid email format
- [x] Email must be unique (no duplicate registrations)
- [x] After registration, user receives verification email
- [x] Account is inactive until email is verified
- [x] User is redirected to login page after registration
- [x] Registration form shows clear error messages for invalid inputs

**Business Rules**:
- User can register with 6 possible roles: donor, corporate_donor, beneficiary, vendor, admin, government
- Email is verified using a unique token sent to the email address
- Verification token expires after 24 hours
- User can request new verification token if expired

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| email | string | Valid email format, unique | Yes |
| password | string | Min 8 chars, 1 uppercase, 1 number | Yes |
| full_name | string | Min 2 chars, max 255 chars | Yes |
| role | enum | Must be one of 6 valid roles | Yes |
| phone | string | Indonesian phone format (+62...) | Optional |
| date_of_birth | date | Valid date, not future | Optional |

**Error Handling**:
- Email already exists: "An account with this email already exists"
- Invalid email format: "Please enter a valid email address"
- Password too weak: "Password must be at least 8 characters with 1 uppercase and 1 number"
- Invalid role: "Please select a valid role"

**Dependencies**:
- FR-AM-002: Email Verification
- FR-AM-003: Login/Logout

**Related API Endpoints**:
- POST /api/auth/register

**Related Database Tables**:
- users
- user_profiles
- user_roles

---

#### FR-AM-002: Email Verification

**Priority**: High  
**Status**: Draft

**Description**:
After registration, users must verify their email address by clicking a verification link sent to their email. Verified accounts are marked as active.

**User Story**:
As a new user, I want to verify my email address, so that my account becomes active and I can access all platform features.

**Acceptance Criteria**:
- [x] User receives verification email immediately after registration
- [x] Email contains a unique verification link
- [x] Clicking the link verifies the email and activates the account
- [x] User is redirected to dashboard after verification
- [x] Verification link expires after 24 hours
- [x] Expired links show error with option to request new link
- [x] Already verified accounts cannot be verified again
- [x] Resend verification option available on login page

**Business Rules**:
- Verification token is generated using UUID
- Token is stored in database with expiration timestamp
- Email is only verified once
- Token can be used only once

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| token | string | Valid UUID, not expired | Yes |

**Error Handling**:
- Invalid token: "Invalid verification link"
- Expired token: "Verification link has expired. Request a new one"
- Already verified: "This email has already been verified"
- Token used: "This verification link has already been used"

**Dependencies**:
- FR-AM-001: User Registration

**Related API Endpoints**:
- GET /api/auth/verify?token={token}
- POST /api/auth/resend-verification

**Related Database Tables**:
- users (is_verified, verification_token, verification_expires)

---

#### FR-AM-003: Login / Logout

**Priority**: High  
**Status**: Draft

**Description**:
Users can login using their email and password. After successful login, a JWT token is issued and stored for authenticated requests. Users can logout to invalidate their session.

**User Story**:
As a registered user, I want to login with my credentials, so that I can access my personalized dashboard and protected features.

**Acceptance Criteria**:
- [x] User can login with email and password
- [x] Invalid credentials show clear error message
- [x] After login, JWT token is issued and stored in localStorage
- [x] User is redirected to role-specific dashboard
- [x] "Remember me" option keeps user logged in for 30 days
- [x] Logout clears JWT token from localStorage
- [x] After logout, user is redirected to login page
- [x] Session timeout after 7 days of inactivity

**Business Rules**:
- Password is verified using bcrypt hash
- JWT token expires after 7 days
- Token can be refreshed using refresh token (future)
- Multiple sessions allowed for same user

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| email | string | Valid email format | Yes |
| password | string | Not empty | Yes |
| remember_me | boolean | boolean | No |

**Error Handling**:
- Email not found: "User with this email not found"
- Wrong password: "Invalid email or password"
- Unverified email: "Please verify your email before logging in"
- Account inactive: "Your account has been deactivated"

**Dependencies**:
- FR-AM-002: Email Verification

**Related API Endpoints**:
- POST /api/auth/login
- POST /api/auth/logout

**Related Database Tables**:
- users
- user_profiles

---

#### FR-AM-004: Password Reset

**Priority**: Medium  
**Status**: Draft

**Description**:
Users can request a password reset if they forget their password. A reset token is sent to their email, which they can use to set a new password.

**User Story**:
As a user who forgot my password, I want to reset it via email, so that I can regain access to my account.

**Acceptance Criteria**:
- [x] User can request password reset from login page
- [x] User enters email address
- [x] If email exists, reset token is sent to email
- [x] Email contains a link to reset password page with token
- [x] User can set new password using the token
- [x] New password must meet security requirements
- [x] Reset token expires after 1 hour
- [x] After successful reset, all existing sessions are invalidated
- [x] Security: Don't reveal if email exists or not

**Business Rules**:
- Reset token is generated using UUID
- Token is stored in database with expiration timestamp
- Old password cannot be reused
- Reset invalidates all active sessions

**Input Validation**:
**Request Reset:**
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| email | string | Valid email format | Yes |

**Reset Password:**
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| token | string | Valid UUID, not expired | Yes |
| new_password | string | Min 8 chars, 1 uppercase, 1 number | Yes |

**Error Handling**:
- Invalid token: "Invalid reset link"
- Expired token: "Reset link has expired. Request a new one"
- Weak password: "Password must be at least 8 characters with 1 uppercase and 1 number"
- Same password: "New password must be different from current password"

**Dependencies**:
- FR-AM-003: Login/Logout

**Related API Endpoints**:
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

**Related Database Tables**:
- users (password_hash, reset_token, reset_expires)

---

#### FR-AM-005: Profile Management

**Priority**: Medium  
**Status**: Draft

**Description**:
Users can view and edit their profile information including name, phone, address, and upload documents (KTP, KK, photo).

**User Story**:
As a user, I want to update my profile information, so that my account information stays current.

**Acceptance Criteria**:
- [x] User can view their complete profile
- [x] User can update: full name, phone, date of birth, gender, address
- [x] User can upload profile photo (JPG, PNG, max 5MB)
- [x] User can upload ID documents (KTP, KK) for verification
- [x] Profile photo and documents are stored in cloud storage
- [x] Validation: File type and size limits
- [x] Changes are saved immediately
- [x] User can view previous document versions
- [x] Email address cannot be changed (security)

**Business Rules**:
- Profile photo is automatically resized and optimized
- Documents are stored in private bucket (only admin can view)
- Document upload requires admin verification for certain roles
- NIK (Indonesian ID) validation using Luhn algorithm

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| full_name | string | Min 2 chars, max 255 chars | Yes |
| phone | string | Indonesian format (+62...) | No |
| date_of_birth | date | Valid date, not future | No |
| gender | enum | male, female | No |
| address | text | Max 1000 chars | No |
| province_id | string | Valid province ID | No |
| district_id | string | Valid district ID | No |
| photo | file | JPG/PNG, max 5MB | No |
| id_card_url | file | JPG/PDF, max 10MB | No |
| family_card_url | file | JPG/PDF, max 10MB | No |

**Error Handling**:
- Invalid file type: "Only JPG and PNG files are allowed"
- File too large: "File size must be less than 5MB"
- Invalid NIK: "Invalid NIK format"
- Update failed: "Failed to update profile. Please try again"

**Dependencies**:
- FR-AM-003: Login/Logout

**Related API Endpoints**:
- GET /api/auth/me
- PUT /api/auth/me
- POST /api/auth/upload-documents

**Related Database Tables**:
- user_profiles
- provinces
- districts

---

#### FR-AM-006: Document Upload (KTP, KK)

**Priority**: High  
**Status**: Draft

**Description**:
Certain user roles (beneficiary, vendor, corporate_donor) must upload identification documents for verification. Documents are uploaded to secure cloud storage.

**User Story**:
As a beneficiary, I want to upload my KTP and KK documents, so that my account can be verified and I can receive vouchers.

**Acceptance Criteria**:
- [x] User can upload KTP (Indonesian ID card)
- [x] User can upload KK (Family Card)
- [x] Document types: JPG, PNG, PDF
- [x] Maximum file size: 10MB
- [x] Documents are uploaded to secure cloud storage
- [x] Upload progress indicator shown
- [x] User can preview uploaded documents
- [x] User can replace documents before verification
- [x] After admin verification, documents cannot be modified
- [x] Notification sent when documents are verified or rejected

**Business Rules**:
- Required documents per role:
  - Beneficiary: KTP + KK
  - Vendor: Business license
  - Corporate Donor: Business registration
- Admin reviews documents manually
- Documents are stored in encrypted storage
- Retention policy: Keep documents for 5 years after account deletion

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| document_type | enum | ktp, kk, business_license, business_registration | Yes |
| file | file | JPG/PNG/PDF, max 10MB | Yes |

**Error Handling**:
- Invalid file type: "Only JPG, PNG, and PDF files are allowed"
- File too large: "File size must be less than 10MB"
- Upload failed: "Failed to upload document. Please try again"
- Corrupt file: "File is corrupted. Please upload a different file"

**Dependencies**:
- FR-AM-005: Profile Management
- FR-AM-008: Role Verification (Admin)

**Related API Endpoints**:
- POST /api/documents/upload
- GET /api/documents/{id}
- DELETE /api/documents/{id}

**Related Database Tables**:
- user_documents

---

#### FR-AM-007: Role Assignment

**Priority**: High  
**Status**: Draft

**Description**:
Users can have multiple roles on the platform. During registration, users select their primary role. Additional roles can be requested later and require admin approval.

**User Story**:
As a donor who also wants to become a beneficiary, I want to request an additional role, so that I can both donate and receive aid if needed.

**Acceptance Criteria**:
- [x] User selects primary role during registration
- [x] User can request additional roles from profile page
- [x] Request includes reason for additional role
- [x] Additional roles require document upload
- [x] Admin reviews and approves/rejects role requests
- [x] User receives notification on approval/rejection
- [x] Approved roles are immediately active
- [x] User can switch between roles in dashboard
- [x] Some roles require verification (beneficiary, vendor, government, admin)

**Business Rules**:
- Role combinations allowed:
  - donor + beneficiary ✓
  - donor + vendor ✓
  - beneficiary + vendor ✗ (conflict of interest)
  - Any + admin ✗ (admin must be separate)
- Beneficiary, vendor, government roles require verification
- Donor role is auto-approved
- Admin role can only be assigned by existing admin

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| role | enum | Must be one of 6 valid roles | Yes |
| reason | text | Min 10 chars, max 500 chars | Yes |
| documents | array | Required for certain roles | Conditional |

**Error Handling**:
- Invalid role: "Invalid role selected"
- Role conflict: "This role conflicts with your existing roles"
- Missing documents: "Please upload required documents for this role"
- Request pending: "You already have a pending request for this role"

**Dependencies**:
- FR-AM-006: Document Upload
- FR-AM-008: Role Verification (Admin)

**Related API Endpoints**:
- POST /api/roles/request
- GET /api/roles
- PUT /api/roles/switch

**Related Database Tables**:
- user_roles

---

#### FR-AM-008: Role Verification (Admin)

**Priority**: High  
**Status**: Draft

**Description**:
Admins must verify user roles that require verification (beneficiary, vendor, government, admin). Verification includes reviewing documents and approving/rejecting the role request.

**User Story**:
As an admin, I want to verify user roles, so that only legitimate users can access certain features and the platform remains secure.

**Acceptance Criteria**:
- [x] Admin can view pending role verification requests
- [x] Admin can view user profile and uploaded documents
- [x] Admin can approve role verification
- [x] Admin can reject role verification with reason
- [x] User receives notification on approval/rejection
- [x] Verified role is marked as active
- [x] Verification audit trail is maintained
- [x] Admin can filter requests by role, date, status
- [x] Bulk approval available for multiple requests

**Business Rules**:
- Roles requiring verification: beneficiary, vendor, government, admin
- Verification must be completed within 7 days
- Rejected requests cannot be resubmitted for 30 days
- Admin must provide rejection reason
- Multiple verification steps may be required (documents + interview)

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| user_id | UUID | Valid user ID | Yes |
| role_id | UUID | Valid role ID | Yes |
| action | enum | approve, reject | Yes |
| rejection_reason | text | Min 10 chars (if reject) | Conditional |

**Error Handling**:
- User not found: "User not found"
- Role not found: "Role not found"
- Already verified: "This role has already been verified"
- Invalid action: "Invalid action"

**Dependencies**:
- FR-AM-007: Role Assignment

**Related API Endpoints**:
- GET /api/admin/verifications
- POST /api/admin/verifications/{id}/approve
- POST /api/admin/verifications/{id}/reject

**Related Database Tables**:
- user_roles (verified, verified_at, verified_by)
- verification_logs

---

#### FR-AM-009: Multi-Role Support

**Priority**: Medium  
**Status**: Draft

**Description**:
Users can have multiple roles on the platform and switch between them. The dashboard adapts to show role-appropriate features and navigation.

**User Story**:
As a user with multiple roles, I want to switch between roles, so that I can access role-specific features without logging out.

**Acceptance Criteria**:
- [x] User can view all their assigned roles
- [x] User can switch between roles from dashboard
- [x] Switching roles updates UI and navigation
- [x] Role-specific features are shown/hidden
- [x] Current role is clearly indicated in UI
- [x] Switching is instant (no page reload)
- [x] Role state is persisted (last used role)
- [x] Notifications are role-filtered
- [x] Profile shows all roles but defaults to primary role

**Business Rules**:
- Primary role is set during registration
- Last used role is remembered for next login
- Some actions require specific roles (enforced by RLS)
- Admin can view all data regardless of current role
- Role switch is logged for audit

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| role_id | UUID | Must be one of user's assigned roles | Yes |

**Error Handling**:
- Role not assigned: "You don't have access to this role"
- Role inactive: "This role is not active"
- Invalid role: "Invalid role selected"

**Dependencies**:
- FR-AM-007: Role Assignment
- FR-AM-008: Role Verification

**Related API Endpoints**:
- GET /api/roles
- POST /api/roles/switch

**Related Database Tables**:
- user_roles

---

## 3.2 Donation Management

This module covers donation creation, management, subscriptions, and impact tracking.

---

#### FR-DM-001: View Donation Plans

**Priority**: High  
**Status**: Draft

**Description**:
Users can view available donation plans with different amounts and durations. Plans show impact estimates and recommended allocations.

**User Story**:
As a donor, I want to see available donation plans, so that I can choose the best option for my budget and impact goals.

**Acceptance Criteria**:
- [x] User can view list of donation plans
- [x] Plans show: amount, duration, estimated impact (families supported)
- [x] Plans include: one-time, monthly, quarterly, annual
- [x] Plan cards show visual impact (e.g., "supports 3 families for 1 month")
- [x] Filter plans by amount range
- [x] Sort plans by popularity, amount, impact
- [x] View plan details with breakdown
- [x] Compare multiple plans side-by-side

**Business Rules**:
- Plan amounts: Rp 100.000, Rp 300.000, Rp 500.000, Rp 1.000.000, Rp 5.000.000
- Impact estimate: 1 voucher = Rp 100.000 feeds 1 family for 2 days
- Custom amount available (min Rp 100.000)
- Popular plans are highlighted

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| filter_min_amount | number | Positive number | No |
| filter_max_amount | number | Positive number | No |
| sort_by | enum | amount, popularity, impact | No |
| sort_order | enum | asc, desc | No |

**Error Handling**:
- Invalid filter: "Invalid filter parameters"

**Dependencies**:
- None

**Related API Endpoints**:
- GET /api/donation-plans

**Related Database Tables**:
- donation_plans

---

#### FR-DM-002: Create One-Time Donation

**Priority**: High  
**Status**: Draft

**Description**:
Users can create a one-time donation by selecting an amount and payment method. After payment, vouchers are allocated to beneficiaries.

**User Story**:
As a donor, I want to make a one-time donation, so that I can contribute immediately without commitment.

**Acceptance Criteria**:
- [x] User can enter donation amount (min Rp 100.000)
- [x] User can select from preset amounts
- [x] User can select payment method (QRIS, bank transfer, credit card)
- [x] User can see impact estimate before payment
- [x] Payment gateway integration
- [x] After payment, user receives confirmation
- [x] Vouchers are automatically allocated
- [x] User can download receipt
- [x] Donation is recorded in history

**Business Rules**:
- Minimum donation: Rp 100.000
- Payment methods: QRIS, VA, credit/debit card (via Midtrans)
- Payment gateway fee: 1.5-3% (absorbed by platform)
- Voucher allocation: 100% of donation amount
- Allocation happens within 5 minutes of payment

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| amount | number | Min 100.000, max 100.000.000 | Yes |
| payment_method | enum | qris, va, card | Yes |
| plan_id | UUID | Valid plan ID (optional) | No |
| message | text | Max 500 chars | No |

**Error Handling**:
- Invalid amount: "Amount must be between Rp 100.000 and Rp 100.000.000"
- Payment failed: "Payment failed. Please try again"
- Invalid payment method: "Invalid payment method"

**Dependencies**:
- FR-DM-001: View Donation Plans
- FR-VS-004: Allocate Vouchers

**Related API Endpoints**:
- POST /api/donations

**Related Database Tables**:
- donations
- payment_transactions

---

#### FR-DM-003: Create Subscription

**Priority**: High  
**Status**: Draft

**Description**:
Users can create recurring donations (subscriptions) with automatic monthly, quarterly, or annual payments. Subscriptions can be managed (pause, resume, cancel).

**User Story**:
As a donor, I want to set up a monthly subscription, so that I can make sustained impact without manual donations.

**Acceptance Criteria**:
- [x] User can select subscription plan (Monthly, Quarterly, Annual)
- [x] User can set subscription amount (min Rp 100.000)
- [x] User can select payment method (saved for recurring)
- [x] User can set start date
- [x] User can review subscription summary before confirming
- [x] Payment is processed automatically on schedule
- [x] User receives email before each payment
- [x] Subscription status: active, paused, cancelled
- [x] Vouchers are allocated after each payment

**Business Rules**:
- Subscription periods: monthly, quarterly, annual
- Minimum amount: Rp 100.000
- Payment is auto-charged on due date
- Failed payments are retried 3 times over 7 days
- After 3 failed payments, subscription is paused
- User can pause for max 3 months
- Cancellation takes effect at next billing date

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| amount | number | Min 100.000, max 100.000.000 | Yes |
| period | enum | monthly, quarterly, annual | Yes |
| payment_method_id | UUID | Valid saved payment method | Yes |
| start_date | date | Future date | Yes |

**Error Handling**:
- Invalid amount: "Amount must be at least Rp 100.000"
- Invalid payment method: "Invalid payment method"
- Payment failed: "Payment failed. Please update your payment method"

**Dependencies**:
- FR-DM-002: Create One-Time Donation

**Related API Endpoints**:
- POST /api/subscriptions

**Related Database Tables**:
- subscriptions
- subscription_payments

---

#### FR-DM-004: Process Payment

**Priority**: High  
**Status**: Draft

**Description**:
System processes payments through integrated payment gateway (Midtrans). Supports multiple payment methods with real-time status updates.

**User Story**:
As a donor, I want to pay for my donation using my preferred method, so that my donation is processed securely and quickly.

**Acceptance Criteria**:
- [x] User selects payment method (QRIS, bank transfer, credit card)
- [x] Payment gateway integration (Midtrans)
- [x] Real-time payment status updates
- [x] Payment success/failure callbacks
- [x] Automatic retry for failed payments (subscriptions)
- [x] Payment receipts generated
- [x] Transaction logs maintained
- [x] Webhook notifications for payment events

**Business Rules****
- Payment gateway: Midtrans (can switch to Xendit)
- Supported methods: QRIS, bank transfer (BCA, Mandiri, BNI, BRI), credit/debit card, e-wallet (GoPay, OVO, Dana)
- Payment expires after 24 hours (for QRIS, bank transfer)
- Payment gateway fee: 1.5-3%
- Refund available within 7 days (for valid reasons)

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| donation_id | UUID | Valid donation ID | Yes |
| payment_method | enum | qris, va, card, ewallet | Yes |
| payment_details | object | Method-specific details | Yes |

**Error Handling**:
- Payment declined: "Payment declined by bank"
- Payment expired: "Payment has expired. Please try again"
- Gateway error: "Payment gateway error. Please try again later"

**Dependencies**:
- FR-DM-002: Create One-Time Donation
- FR-DM-003: Create Subscription

**Related API Endpoints**:
- POST /api/payments/process
- POST /api/payments/callback
- GET /api/payments/{id}/status

**Related Database Tables**:
- payment_transactions
- payment_webhooks

---

#### FR-DM-005: Pause/Resume Subscription

**Priority**: Medium  
**Status**: Draft

**Description**:
Users can pause their subscription for a maximum period and resume when ready. Paused subscriptions don't process payments.

**User Story**:
As a donor, I want to pause my subscription temporarily, so that I can manage my finances without cancelling completely.

**Acceptance Criteria**:
- [x] User can pause subscription
- [x] User selects pause duration (1-3 months)
- [x] Pause takes effect immediately or next billing date
- [x] User can resume subscription anytime
- [x] Resume takes effect immediately
- [x] Next payment date is updated
- [x] User receives confirmation email
- [x] Subscription status updated to "paused" or "active"

**Business Rules**:
- Max pause duration: 3 months
- Paused subscriptions: no payments, no voucher allocation
- Resume resets billing cycle
- No fees for pausing/resuming
- Max 3 pauses per year

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| action | enum | pause, resume | Yes |
| resume_date | date | Future date (if pause) | No |

**Error Handling**:
- Already paused: "Subscription is already paused"
- Pause limit reached: "You have reached maximum pause limit"
- Invalid resume date: "Invalid resume date"

**Dependencies**:
- FR-DM-003: Create Subscription

**Related API Endpoints**:
- POST /api/subscriptions/{id}/pause
- POST /api/subscriptions/{id}/resume

**Related Database Tables**:
- subscriptions (status, paused_at, paused_until)

---

#### FR-DM-006: Cancel Subscription

**Priority**: Medium  
**Status**: Draft

**Description**:
Users can cancel their subscription. Cancellation takes effect at the next billing date, not immediately.

**User Story**:
As a donor, I want to cancel my subscription, so that I can stop automatic payments.

**Acceptance Criteria**:
- [x] User can request subscription cancellation
- [x] System shows cancellation terms
- [x] User confirms cancellation
- [x] Cancellation takes effect at next billing date
- [x] User receives confirmation email
- [x] Subscription status updated to "cancelled"
- [x] No further payments processed
- [x] User can re-activate cancelled subscription (creates new subscription)

**Business Rules**:
- Cancellation effective date: Next billing date
- Prorated refunds: Not provided
- User can re-activate (starts new subscription)
- Payment history preserved
- Impact data remains accessible

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| reason | enum | financial, no_longer_interested, other | Yes |
| feedback | text | Max 500 chars | No |

**Error Handling**:
- Already cancelled: "Subscription is already cancelled"
- Cannot cancel: "Cannot cancel this subscription"

**Dependencies**:
- FR-DM-003: Create Subscription

**Related API Endpoints**:
- POST /api/subscriptions/{id}/cancel

**Related Database Tables**:
- subscriptions (status, cancelled_at, cancellation_reason)

---

#### FR-DM-007: View Donation History

**Priority**: High  
**Status**: Draft

**Description**:
Users can view their complete donation history including one-time donations, subscription payments, and impact metrics.

**User Story**:
As a donor, I want to see my donation history, so that I can track my contributions and impact over time.

**Acceptance Criteria**:
- [x] User can view list of all donations
- [x] Each donation shows: date, amount, plan, status, impact
- [x] Filter by date range, amount, status, type
- [x] Sort by date, amount
- [x] Pagination (20 items per page)
- [x] Click donation to view details
- [x] Export to CSV/PDF
- [x] View total donated and total impact
- [x] View subscription payments separately

**Business Rules**:
- History shows all time (no limit)
- Total aggregated stats available
- Impact metrics: vouchers funded, beneficiaries supported, families fed

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| start_date | date | Valid date | No |
| end_date | date | Valid date, after start_date | No |
| status | enum | success, pending, failed | No |
| type | enum | onetime, subscription | No |
| page | number | Positive integer | No |
| limit | number | Positive integer, max 100 | No |

**Error Handling**:
- Invalid date range: "End date must be after start date"
- Invalid status: "Invalid status filter"

**Dependencies**:
- FR-DM-002: Create One-Time Donation
- FR-DM-003: Create Subscription

**Related API Endpoints**:
- GET /api/donations
- GET /api/donations/export

**Related Database Tables**:
- donations
- subscription_payments

---

#### FR-DM-008: Download Receipt

**Priority**: Medium  
**Status**: Draft

**Description**:
Users can download donation receipts in PDF format for tax purposes and personal records. Receipts include donation details and payment confirmation.

**User Story**:
As a donor, I want to download my donation receipt, so that I can use it for tax purposes.

**Acceptance Criteria**:
- [x] User can download receipt for each donation
- [x] Receipt is in PDF format
- [x] Receipt includes: donor info, donation details, payment confirmation, tax ID
- [x] Receipt has NutriGuard branding
- [x] Receipt has unique receipt number
- [x] Receipt is generated on-demand
- [x] Download link expires after 24 hours
- [x] Receipt cannot be modified after generation

**Business Rules**:
- Receipt format: PDF
- Tax ID: NutriGuard NPWP (for tax purposes)
- Receipt number format: NTG-YYYYMMDD-XXXXX
- Receipt is immutable once generated
- Stored in cloud storage with CDN delivery

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| donation_id | UUID | Valid donation ID, belongs to user | Yes |

**Error Handling**:
- Donation not found: "Donation not found"
- Access denied: "You don't have access to this donation"

**Dependencies**:
- FR-DM-002: Create One-Time Donation
- FR-DM-003: Create Subscription

**Related API Endpoints**:
- GET /api/donations/{id}/receipt

**Related Database Tables**:
- donations (receipt_number)
- receipt_files

---

#### FR-DM-009: View Impact Dashboard

**Priority**: High  
**Status**: Draft

**Description**:
Users can view impact dashboard showing real-time statistics on their donations including vouchers funded, beneficiaries supported, and community impact.

**User Story**:
As a donor, I want to see my impact dashboard, so that I can understand how my donations are making a difference.

**Acceptance Criteria**:
- [x] Dashboard shows real-time impact metrics
- [x] Metrics include: total donated, vouchers funded, beneficiaries supported, families fed
- [x] Charts: donation trend over time, impact by region
- [x] Map: geographic distribution of beneficiaries
- [x] Beneficiary stories (anonymized)
- [x] Time filter: last 7 days, 30 days, 90 days, all time
- [x] Comparison with platform averages
- [x] Shareable impact report

**Business Rules**:
- Data is real-time or updated daily
- Beneficiary stories are anonymized (no personal info)
- Geographic data at province level (not specific)
- Impact calculation: 1 voucher = 1 family for 2 days

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| time_range | enum | 7d, 30d, 90d, all | No |

**Error Handling**:
- No data: "No donation data available"

**Dependencies**:
- FR-DM-007: View Donation History
- FR-VS-003: View Voucher Transactions

**Related API Endpoints**:
- GET /api/impact/summary
- GET /api/impact/metrics
- GET /api/impact/beneficiaries

**Related Database Tables**:
- donations
- vouchers
- beneficiary_impact

---

#### FR-DM-010: Allocate Vouchers to Beneficiaries

**Priority**: High  
**Status**: Draft

**Description**:
After successful donation payment, system automatically allocates vouchers to eligible beneficiaries based on FIES scores and geographic preferences.

**User Story**:
As the system, I want to automatically allocate vouchers to beneficiaries, so that donations quickly reach those in need.

**Acceptance Criteria**:
- [x] Vouchers are allocated within 5 minutes of payment
- [x] Allocation based on FIES score (higher priority to severe insecurity)
- [x] Geographic preference considered (if donor specified)
- [x] Batch allocation for multiple beneficiaries
- [x] Notification sent to beneficiaries
- [x] Allocation logged for tracking
- [x] Reallocation available if beneficiary doesn't redeem
- [x] Admin can manually allocate vouchers

**Business Rules**:
- Allocation priority: FIES score (6-8 highest, then 3-5, then 1-2)
- Minimum voucher amount: Rp 100.000
- Maximum voucher amount: Rp 1.000.000 (per allocation)
- Vouchers expire after 1 month
- Unredeemed vouchers can be reallocated after 3 weeks
- Batch allocation: 10-20 beneficiaries per donation

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| donation_id | UUID | Valid donation ID | Yes |
| allocation_strategy | enum | auto, manual | Yes |
| beneficiary_ids | array | Valid beneficiary UUIDs (if manual) | Conditional |

**Error Handling**:
- No eligible beneficiaries: "No eligible beneficiaries found"
- Allocation failed: "Failed to allocate vouchers"

**Dependencies**:
- FR-VS-001: View Voucher Balance
- FR-VS-004: Validate Voucher Code

**Related API Endpoints**:
- POST /api/vouchers/allocate
- POST /api/admin/vouchers/allocate

**Related Database Tables**:
- vouchers
- voucher_allocations
- beneficiaries

---

## 3.3 Voucher System

This module covers voucher creation, allocation, redemption, and transaction tracking.

---

#### FR-VS-001: View Voucher Balance

**Priority**: High  
**Status**: Draft

**Description**:
Beneficiaries can view their current voucher balance including available amount, total allocated, and redemption history.

**User Story**:
As a beneficiary, I want to see my voucher balance, so that I know how much I have available to spend.

**Acceptance Criteria**:
- [x] User can view current voucher balance
- [x] Shows: available balance, total allocated, total redeemed
- [x] List of active vouchers with expiration dates
- [x] Filter by status (active, expired, redeemed)
- [x] Sort by amount, date, expiration
- [x] Real-time balance updates
- [x] Alert for vouchers expiring soon (within 7 days)

**Business Rules**:
- Balance is sum of all active vouchers
- Vouchers expire 1 month after allocation
- Expired vouchers are removed from balance
- Real-time updates via Supabase Realtime

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| status | enum | active, expired, redeemed | No |

**Error Handling**:
- No vouchers: "No vouchers found"

**Dependencies**:
- FR-VS-004: Allocate Vouchers (for beneficiaries)

**Related API Endpoints**:
- GET /api/vouchers/balance
- GET /api/vouchers

**Related Database Tables**:
- vouchers
- voucher_transactions

---

#### FR-VS-002: View Voucher Transactions

**Priority**: Medium  
**Status**: Draft

**Description**:
Users can view their complete voucher transaction history including allocations, redemptions, and adjustments.

**User Story**:
As a beneficiary, I want to see my voucher transactions, so that I can track my voucher usage.

**Acceptance Criteria**:
- [x] User can view list of all voucher transactions
- [x] Each transaction shows: date, type, amount, balance, status
- [x] Transaction types: allocated, redeemed, expired, adjusted, revoked
- [x] Filter by date range, type, status
- [x] Sort by date, amount
- [x] Pagination (20 items per page)
- [x] Click transaction to view details
- [x] Export to CSV

**Business Rules**:
- All transactions are immutable
- Transaction history is kept indefinitely
- Real-time updates via Supabase Realtime

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| start_date | date | Valid date | No |
| end_date | date | Valid date, after start_date | No |
| type | enum | allocated, redeemed, expired, adjusted, revoked | No |
| page | number | Positive integer | No |
| limit | number | Positive integer, max 100 | No |

**Error Handling**:
- Invalid date range: "End date must be after start date"
- No transactions: "No transactions found"

**Dependencies**:
- FR-VS-001: View Voucher Balance

**Related API Endpoints**:
- GET /api/vouchers/transactions
- GET /api/vouchers/transactions/export

**Related Database Tables**:
- voucher_transactions

---

#### FR-VS-003: Check Voucher Eligibility

**Priority**: High  
**Status**: Draft

**Description**:
Before checkout, system checks if voucher is eligible for products in cart based on allowed categories and redemption rules.

**User Story**:
As a beneficiary, I want to know which products I can buy with my voucher, so that I don't add ineligible items.

**Acceptance Criteria**:
- [x] System checks each product in cart
- [x] Shows which products are eligible/ineligible
- [x] Calculates eligible subtotal
- [x] Shows maximum voucher amount that can be used
- [x] Warns if cart has ineligible products
- [x] Shows remaining voucher balance after calculation
- [x] Real-time validation as cart changes

**Business Rules**:
- Vouchers only for nutrition products (categories: staples, proteins, dairy, fruits, vegetables, fortified)
- Non-eligible: alcohol, tobacco, non-food items
- Voucher covers up to 100% of eligible items
- Can use partial voucher (use only what's needed)
- Cannot exceed voucher balance

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| cart_items | array | Array of product IDs | Yes |
| voucher_id | UUID | Valid voucher ID | Yes |

**Error Handling**:
- No eligible products: "No eligible products in cart"
- Invalid voucher: "Invalid voucher"

**Dependencies**:
- FR-VS-001: View Voucher Balance
- FR-PC-001: Browse Products

**Related API Endpoints**:
- POST /api/vouchers/check-eligibility

**Related Database Tables**:
- vouchers
- products

---

#### FR-VS-004: Validate Voucher Code

**Priority**: High  
**Status**: Draft

**Description**:
During checkout, system validates voucher code to ensure it's active, not expired, and has sufficient balance.

**User Story**:
As a beneficiary, I want to apply my voucher code at checkout, so that I can use my vouchers.

**Acceptance Criteria**:
- [x] User can enter voucher code
- [x] System validates voucher
- [x] Validation checks: active, not expired, sufficient balance, not revoked
- [x] Shows voucher amount and expiration
- [x] Shows error message if invalid
- [x] Voucher can be used multiple times until balance depleted
- [x] Voucher is locked during transaction to prevent double use

**Business Rules**:
- Voucher format: 16-character alphanumeric code
- Voucher must be active and not expired
- Balance must be >= order amount
- Voucher locked for 5 minutes during transaction
- Locked voucher is released if transaction fails

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| voucher_code | string | 16 chars, alphanumeric | Yes |

**Error Handling**:
- Invalid code: "Invalid voucher code"
- Voucher expired: "This voucher has expired"
- Insufficient balance: "Insufficient voucher balance"
- Voucher locked: "This voucher is currently in use. Please try again later"
- Voucher revoked: "This voucher has been revoked"

**Dependencies**:
- FR-VS-001: View Voucher Balance

**Related API Endpoints**:
- POST /api/vouchers/validate

**Related Database Tables**:
- vouchers

---

#### FR-VS-005: Redeem Voucher

**Priority**: High  
**Status**: Draft

**Description**:
During checkout, voucher is redeemed and balance is deducted. Redemption is atomic and cannot be rolled back once completed.

**User Story**:
As a beneficiary, I want to redeem my voucher at checkout, so that I can complete my purchase.

**Acceptance Criteria**:
- [x] Voucher is redeemed during order creation
- [x] Balance is deducted from voucher
- [x] Transaction is logged
- [x] Order is created with voucher reference
- [x] User can view remaining balance
- [x] Voucher expires if fully used (balance = 0)
- [x] Redemption is atomic (all or nothing)
- [x] Cannot redeem if voucher locked or expired

**Business Rules**:
- Voucher balance must >= order amount
- Redemption is irreversible once order is created
- Transaction recorded with timestamp
- Remaining balance is updated immediately
- Zero-balance vouchers are marked as "fully redeemed"

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| voucher_id | UUID | Valid voucher ID | Yes |
| order_id | UUID | Valid order ID | Yes |
| amount | number | Positive, <= voucher balance | Yes |

**Error Handling**:
- Invalid voucher: "Invalid voucher"
- Insufficient balance: "Insufficient voucher balance"
- Voucher locked: "Voucher is locked. Please try again later"
- Redemption failed: "Failed to redeem voucher"

**Dependencies**:
- FR-VS-004: Validate Voucher Code
- FR-OC-006: Create Order

**Related API Endpoints**:
- POST /api/vouchers/redeem

**Related Database Tables**:
- vouchers
- voucher_transactions
- orders

---

#### FR-VS-006: Handle Voucher Expiration

**Priority**: High  
**Status**: Draft

**Description**:
Vouchers automatically expire 1 month after allocation. System sends reminders before expiration and handles expired vouchers.

**User Story**:
As a beneficiary, I want to be reminded before my voucher expires, so that I can use it in time.

**Acceptance Criteria**:
- [x] Vouchers expire 1 month after allocation
- [x] System checks for expired vouchers daily (cron job)
- [x] Reminder sent 7 days, 3 days, and 1 day before expiration
- [x] Expired vouchers are marked as "expired"
- [x] Expired vouchers are removed from balance
- [x] Unredeemed expired vouchers are logged
- [x] Admin can extend expiration (exception case)
- [x] User views expiration date in dashboard

**Business Rules**:
- Expiration period: 30 days from allocation
- Reminders via email and in-app notification
- Expired vouchers cannot be redeemed
- Admin can extend expiration for exceptional cases
- Expiration data used for analytics

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| voucher_id | UUID | Valid voucher ID | Yes |
| extend_days | number | Positive, max 30 (admin only) | Yes |

**Error Handling**:
- Voucher already expired: "Voucher has already expired"
- Cannot extend: "Cannot extend this voucher"

**Dependencies**:
- FR-VS-001: View Voucher Balance

**Related API Endpoints**:
- POST /api/admin/vouchers/{id}/extend-expiration
- GET /api/vouchers/expiring

**Related Database Tables**:
- vouchers (expires_at, status)

---

#### FR-VS-007: Check Allowed Categories

**Priority**: Medium  
**Status**: Draft

**Description**:
System validates that products being purchased are in allowed categories for voucher redemption. Only nutrition products are eligible.

**User Story**:
As a beneficiary, I want to see which product categories are allowed, so that I can shop accordingly.

**Acceptance Criteria**:
- [x] System shows allowed product categories
- [x] Allowed categories: staples, proteins, dairy, fruits, vegetables, fortified foods
- [x] Products are tagged with category
- [x] Cart shows eligible vs ineligible products
- [x] Warning if cart contains ineligible products
- [x] Ineligible products cannot be paid with voucher

**Business Rules**:
- Allowed categories defined by platform
- Cannot use voucher for non-food items
- Cannot use voucher for alcohol, tobacco
- Products in catalog are pre-tagged with categories
- Admin can add/remove allowed categories

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| product_ids | array | Array of product IDs | Yes |

**Error Handling**:
- Products not allowed: "Some products are not eligible for voucher redemption"

**Dependencies**:
- FR-PC-001: Browse Products

**Related API Endpoints**:
- GET /api/vouchers/allowed-categories
- POST /api/vouchers/check-categories

**Related Database Tables**:
- products
- product_categories
- voucher_allowed_categories

---

#### FR-VS-008: Daily Allocation Limit

**Priority**: Medium  
**Status**: Draft

**Description**:
System enforces daily allocation limits for vouchers to prevent rapid depletion and ensure fair distribution across beneficiaries.

**User Story**:
As the system, I want to limit daily voucher allocations, so that vouchers are distributed fairly over time.

**Acceptance Criteria**:
- [x] System checks daily allocation limit
- [x] Limit is configurable (default: 20% of total vouchers)
- [x] Daily allocation resets at midnight
- [x] Limit shown to admins
- [x] Notifications sent when limit reached
- [x] Remaining vouchers queued for next day

**Business Rules**:
- Daily limit: 20% of total available vouchers
- Configurable by admin
- Limit resets at 00:00 WIB
- Urgent requests can override limit (admin approval)
- Analytics track daily vs monthly allocations

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| allocation_amount | number | Positive | Yes |

**Error Handling**:
- Limit exceeded: "Daily allocation limit reached. Please try again tomorrow"

**Dependencies**:
- FR-VS-004: Allocate Vouchers

**Related API Endpoints**:
- GET /api/vouchers/allocation-status
- POST /api/admin/vouchers/override-limit

**Related Database Tables**:
- vouchers
- allocation_limits
- allocation_logs

---

#### FR-VS-009: Voucher Revocation (Admin)

**Priority**: Medium  
**Status**: Draft

**Description**:
Admins can revoke vouchers in cases of fraud, abuse, or system errors. Revoked vouchers cannot be redeemed and balance is refunded to donor.

**User Story**:
As an admin, I want to revoke fraudulent vouchers, so that platform funds are protected.

**Acceptance Criteria**:
- [x] Admin can select voucher to revoke
- [x] Admin provides revocation reason
- [x] Voucher status changed to "revoked"
- [x] Voucher cannot be redeemed after revocation
- [x] Beneficiary notified of revocation
- [x] Revocation logged for audit
- [x] Balance refunded to donor (or reallocated)
- [x] Revocation report generated

**Business Rules**:
- Revocation requires admin approval
- Valid reasons: fraud, abuse, system error, beneficiary request
- Refund: Return to donor pool or reallocate
- Revoked voucher balance is locked
- Beneficiary can appeal revocation

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| voucher_id | UUID | Valid voucher ID | Yes |
| reason | enum | fraud, abuse, error, beneficiary_request | Yes |
| notes | text | Max 500 chars | Yes |
| refund_option | enum | donor, reallocate | Yes |

**Error Handling**:
- Voucher already redeemed: "Voucher has already been redeemed"
- Voucher expired: "Voucher has expired"

**Dependencies**:
- FR-VS-005: Redeem Voucher

**Related API Endpoints**:
- POST /api/admin/vouchers/{id}/revoke
- GET /api/admin/vouchers/revoked

**Related Database Tables**:
- vouchers
- voucher_revocations
- refunds

---

## 3.4 Product & Catalog

This module covers product browsing, search, filtering, and vendor product management.

---

#### FR-PC-001: Browse Products

**Priority**: High  
**Status**: Draft

**Description**:
Beneficiaries can browse the product catalog with pagination, sorting, and filtering options.

**User Story**:
As a beneficiary, I want to browse products, so that I can find nutrition products to purchase.

**Acceptance Criteria**:
- [x] User can view product catalog
- [x] Pagination (20 items per page, configurable)
- [x] Sort by: name, price, popularity, new arrivals
- [x] Filter by category
- [x] Filter by price range
- [x] Filter by vendor
- [x] Filter by stock availability (in stock only)
- [x] Search by product name
- [x] Show product image, name, price, vendor

**Business Rules**:
- Only approved products shown
- Pagination default: 20 items
- Sort default: popularity
- Search relevance by name and description
- Out of stock products hidden by default

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| page | number | Positive integer | No |
| limit | number | Positive integer, max 100 | No |
| category_id | UUID | Valid category ID | No |
| vendor_id | UUID | Valid vendor ID | No |
| search | string | Min 2 chars | No |
| min_price | number | Positive | No |
| max_price | number | Positive | No |
| sort_by | enum | name, price, popularity, created_at | No |
| sort_order | enum | asc, desc | No |

**Error Handling**:
- No products found: "No products found matching your criteria"

**Dependencies**:
- FR-VS-007: Check Allowed Categories

**Related API Endpoints**:
- GET /api/products

**Related Database Tables**:
- products
- product_categories
- vendors

---

#### FR-PC-002: Search Products

**Priority**: High  
**Status**: Draft

**Description**:
Users can search for products by name, description, or nutrition keywords.

**User Story**:
As a beneficiary, I want to search for products, so that I can quickly find what I need.

**Acceptance Criteria**:
- [x] Search by product name
- [x] Search by description
- [x] Search by nutrition keywords (protein, calcium, etc.)
- [x] Search results ranked by relevance
- [x] Highlight search terms in results
- [x] Show search suggestions as user types
- [x] Show number of results
- [x] Search history saved

**Business Rules**:
- Minimum search term: 2 characters
- Full-text search enabled
- Search results cached for 1 hour
- Search history retained for 30 days

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| query | string | Min 2 chars, max 100 chars | Yes |
| category_id | UUID | Valid category ID | No |
| limit | number | Positive integer, max 20 | No |

**Error Handling**:
- Empty search: "Please enter a search term"
- No results: "No products found. Try different keywords."

**Dependencies**:
- FR-PC-001: Browse Products

**Related API Endpoints**:
- GET /api/products/search
- GET /api/products/suggestions

**Related Database Tables**:
- products
- search_history

---

#### FR-PC-003: Filter by Category

**Priority**: High  
**Status**: Draft

**Description**:
Users can filter products by category to browse specific nutrition product types.

**User Story**:
As a beneficiary, I want to filter by category, so that I can find specific types of nutrition products.

**Acceptance Criteria**:
- [x] User can view all categories
- [x] Categories have icons and names
- [x] Filter products by single category
- [x] Filter products by multiple categories
- [x] Category filter active on browse page
- [x] Show product count per category
- [x] Categories shown in Indonesian

**Business Rules**:
- 5 main categories: staples, proteins, dairy, fruits/vegetables, fortified
- Categories have hierarchical structure (future)
- Filter applied instantly (no page reload)

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| category_ids | array | Valid category UUIDs | No |

**Error Handling**:
- Invalid category: "Invalid category selected"

**Dependencies**:
- FR-PC-001: Browse Products

**Related API Endpoints**:
- GET /api/categories
- GET /api/products?category_id={id}

**Related Database Tables**:
- product_categories
- products

---

#### FR-PC-004: Sort Products

**Priority**: Medium  
**Status**: Draft

**Description**:
Users can sort products by various criteria to find products that meet their needs.

**User Story**:
As a beneficiary, I want to sort products by price or popularity, so that I can compare options easily.

**Acceptance Criteria**:
- [x] Sort by: name (A-Z, Z-A)
- [x] Sort by: price (low to high, high to low)
- [x] Sort by: popularity (most popular, least popular)
- [x] Sort by: new arrivals (newest first)
- [x] Sort selection persists during session
- [x] Sort indicator visible in UI

**Business Rules**:
- Sort options available based on current filter
- Default sort: popularity
- New arrivals: products added in last 30 days
- Popularity: based on number of purchases

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| sort_by | enum | name, price, popularity, created_at | No |
| sort_order | enum | asc, desc | No |

**Dependencies**:
- FR-PC-001: Browse Products

**Related API Endpoints**:
- GET /api/products?sort_by={field}&sort_order={order}

**Related Database Tables**:
- products
- order_items

---

#### FR-PC-005: View Product Details

**Priority**: High  
**Status**: Draft

**Description**:
Users can view detailed product information including description, nutrition info, and vendor details.

**User Story**:
As a beneficiary, I want to see product details, so that I can make informed purchase decisions.

**Acceptance Criteria**:
- [x] User can view complete product details
- [x] Details include: name, description, price, stock, vendor
- [x] Multiple product images (gallery)
- [x] Nutrition information per serving
- [x] Product ratings and reviews
- [x] Related products (same category)
- [x] Vendor information (name, address, rating)
- [x] Product tags and labels (e.g., "high protein", "fortified")

**Business Rules**:
- Images: minimum 1, maximum 5
- Nutrition info per 100g/ml
- Vendor link to vendor profile
- Related products: top 4 from same category

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| product_id | UUID | Valid product ID | Yes |

**Error Handling**:
- Product not found: "Product not found or has been removed"

**Dependencies**:
- FR-PC-001: Browse Products

**Related API Endpoints**:
- GET /api/products/{id}
- GET /api/products/{id}/related

**Related Database Tables**:
- products
- nutrition_info
- vendors
- reviews

---

#### FR-PC-006: View Nutrition Info

**Priority**: High  
**Status**: Draft

**Description**:
Products display comprehensive nutrition information to help beneficiaries make healthy choices.

**User Story**:
As a beneficiary, I want to see nutrition information, so that I can choose healthy products.

**Acceptance Criteria**:
- [x] Nutrition info displayed per 100g/100ml
- [x] Info includes: calories, protein, carbs, fat, fiber
- [x] Additional info: vitamins, minerals (where available)
- [x] Serving size shown
- [x] Comparison with daily values (percentage)
- [x] Visual indicators (e.g., "high protein", "low fat")
- [x] Fortification status shown

**Business Rules**:
- Required nutrition fields: calories, protein, carbs, fat
- Optional: fiber, sugar, vitamins, minerals
- Daily values based on WHO standards
- Fortification labels for fortified products

**Input Validation**:
No validation (read-only)

**Dependencies**:
- FR-PC-005: View Product Details

**Related API Endpoints**:
- GET /api/products/{id}/nutrition

**Related Database Tables**:
- nutrition_info
- products

---

#### FR-PC-007: Vendor Add Product

**Priority**: High  
**Status**: Draft

**Description**:
Vendors can add new products to the catalog with complete product information and nutrition data.

**User Story**:
As a vendor, I want to add products to the catalog, so that beneficiaries can purchase from me.

**Acceptance Criteria**:
- [x] Vendor can add product details
- [x] Upload product images (1-5 images)
- [x] Select product category
- [x] Set price and stock
- [x] Provide nutrition information
- [x] Product status: pending approval initially
- [x] Product not visible until approved
- [x] Notification sent when approved
- [x] Draft products can be saved

**Business Rules**:
- Required fields: name, category, price, stock, nutrition info
- Images: JPG/PNG, max 5MB each
- Price: min Rp 1.000, max Rp 10.000.000
- Stock: max 10.000 units
- Nutrition info mandatory for nutrition categories
- Admin approval required before visibility

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| name | string | Min 2 chars, max 255 chars | Yes |
| name_id | string | Min 2 chars, max 255 chars (Indonesian) | Yes |
| description | text | Max 1000 chars | Yes |
| category_id | UUID | Valid category ID | Yes |
| price | number | Min 1.000, max 10.000.000 | Yes |
| stock | number | Non-negative, max 10.000 | Yes |
| unit | string | Max 20 chars (e.g., kg, liter, pcs) | Yes |
| images | array | 1-5 images, max 5MB each | Yes |
| nutrition_info | object | Required fields: calories, protein, carbs, fat | Yes |

**Error Handling**:
- Missing required fields: "Please fill in all required fields"
- Invalid price: "Price must be between Rp 1.000 and Rp 10.000.000"
- Invalid stock: "Stock cannot exceed 10.000"
- Invalid images: "Images must be JPG or PNG, max 5MB each"

**Dependencies**:
- FR-AM-007: Role Assignment (vendor role)

**Related API Endpoints**:
- POST /api/vendor/products

**Related Database Tables**:
- products
- product_images
- nutrition_info

---

#### FR-PC-008: Vendor Edit Product

**Priority**: Medium  
**Status**: Draft

**Description**:
Vendors can edit existing product details including price, stock, and images.

**User Story**:
As a vendor, I want to edit my products, so that I can keep information up to date.

**Acceptance Criteria**:
- [x] Vendor can edit all product fields
- [x] Add/remove images
- [x] Update price and stock
- [x] Update nutrition information
- [x] Edit draft products
- [x] Edit approved products (requires re-approval)
- [x] Version history maintained
- [x] Changes logged for audit

**Business Rules**:
- Draft products: no re-approval needed
- Approved products: price/stock changes immediate, other changes require re-approval
- Images can be replaced (old images deleted after 7 days)
- Version history retained for 90 days

**Input Validation**:
Same as FR-PC-007, all fields optional

**Error Handling**:
- Product not found: "Product not found"
- Not product owner: "You don't have permission to edit this product"
- Approval pending: "Product is pending approval. Changes will be queued."

**Dependencies**:
- FR-PC-007: Vendor Add Product

**Related API Endpoints**:
- PUT /api/vendor/products/{id}

**Related Database Tables**:
- products
- product_history

---

#### FR-PC-009: Vendor Delete Product

**Priority**: Low  
**Status**: Draft

**Description**:
Vendors can delete their products from the catalog. Products with orders cannot be deleted.

**User Story**:
As a vendor, I want to delete products, so that I can remove items I no longer sell.

**Acceptance Criteria**:
- [x] Vendor can delete own products
- [x] Confirm deletion with reason
- [x] Products with no orders can be deleted immediately
- [x] Products with orders: marked as "discontinued" instead
- [x] Discontinued products not shown in catalog
- [x] Can re-activate discontinued products
- [x] Deletion/continuation logged

**Business Rules**:
- Delete: No orders within last 30 days
- Discontinue: Has orders within last 30 days
- Discontinued products hidden from search
- Can re-activate discontinued products
- Data retained for 90 days then archived

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| reason | enum | out_of_stock, no_longer_sell, other | Yes |

**Error Handling**:
- Product not found: "Product not found"
- Has active orders: "Product has active orders. Mark as discontinued instead."
- Already discontinued: "Product is already discontinued"

**Dependencies**:
- FR-PC-008: Vendor Edit Product

**Related API Endpoints**:
- DELETE /api/vendor/products/{id}
- POST /api/vendor/products/{id}/discontinue
- POST /api/vendor/products/{id}/reactivate

**Related Database Tables**:
- products (status, discontinued_at)

---

#### FR-PC-010: Admin Approve Product

**Priority**: High  
**Status**: Draft

**Description**:
Admins review and approve new product submissions before they become visible in the catalog.

**User Story**:
As an admin, I want to approve products, so that only legitimate products are available on the platform.

**Acceptance Criteria**:
- [x] Admin can view pending product submissions
- [x] View complete product details
- [x] View vendor information
- [x] Approve or reject products
- [x] Provide rejection reason
- [x] Batch approve multiple products
- [x] Notification sent to vendor on approval/rejection
- [x] Approved products become visible immediately

**Business Rules**:
- Required verification: product images, nutrition info, price
- Rejection reasons: incomplete info, inappropriate content, invalid category
- Approval action logged
- Vendor can resubmit after rejection (fix issues first)

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| product_ids | array | Valid product UUIDs | Yes |
| action | enum | approve, reject | Yes |
| rejection_reason | text | Min 10 chars (if reject) | Conditional |

**Error Handling**:
- Products not found: "One or more products not found"
- Already reviewed: "Products have already been reviewed"

**Dependencies**:
- FR-PC-007: Vendor Add Product

**Related API Endpoints**:
- GET /api/admin/products/pending
- POST /api/admin/products/approve
- POST /api/admin/products/reject

**Related Database Tables**:
- products (status, approved_at, approved_by, rejected_at, rejected_reason)

---

## 3.5 Orders & Checkout

This module covers shopping cart, order creation, voucher redemption, and order management.

---

#### FR-OC-001: Add to Cart

**Priority**: High  
**Status**: Draft

**Description**:
Beneficiaries can add products to their shopping cart for later purchase.

**User Story**:
As a beneficiary, I want to add products to cart, so that I can purchase multiple items at once.

**Acceptance Criteria**:
- [x] User can add product to cart
- [x] Specify quantity
- [x] Cart persists across sessions
- [x] Show item count in cart icon
- [x] Duplicate products: update quantity instead of adding new line
- [x] Stock validation: cannot add more than available
- [x] Cart accessible from any page
- [x] Cart shows: product, quantity, subtotal

**Business Rules**:
- Max cart items: 50 different products
- Max quantity per product: 100 units
- Cart expires after 7 days of inactivity
- Stock checked at add time

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| product_id | UUID | Valid product ID | Yes |
| quantity | number | Positive integer, <= stock, <= 100 | Yes |

**Error Handling**:
- Product not found: "Product not found"
- Out of stock: "Not enough stock available"
- Max quantity: "Maximum quantity for this product is 100"
- Cart full: "Cart is full (max 50 items)"

**Dependencies**:
- FR-PC-001: Browse Products

**Related API Endpoints**:
- POST /api/cart/items
- GET /api/cart

**Related Database Tables**:
- cart_items
- products

---

#### FR-OC-002: Update Cart Quantity

**Priority**: High  
**Status**: Draft

**Description**:
Users can update quantities of items in their cart.

**User Story**:
As a beneficiary, I want to update cart quantities, so that I can adjust my order before checkout.

**Acceptance Criteria**:
- [x] User can increase item quantity
- [x] User can decrease item quantity
- [x] Set quantity to 0 removes item from cart
- [x] Stock validation on quantity update
- [x] Subtotal recalculated immediately
- [x] Cart totals updated

**Business Rules**:
- Max quantity: 100 units per product
- Stock checked at update time
- Subtotal updated real-time

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| cart_item_id | UUID | Valid cart item ID | Yes |
| quantity | number | Positive integer, <= stock, <= 100 | Yes |

**Error Handling**:
- Invalid quantity: "Quantity must be between 1 and 100"
- Out of stock: "Not enough stock available"
- Cart item not found: "Item not found in cart"

**Dependencies**:
- FR-OC-001: Add to Cart

**Related API Endpoints**:
- PUT /api/cart/items/{id}
- DELETE /api/cart/items/{id}

**Related Database Tables**:
- cart_items

---

#### FR-OC-003: Remove from Cart

**Priority**: Medium  
**Status**: Draft

**Description**:
Users can remove items from their cart.

**User Story**:
As a beneficiary, I want to remove items from cart, so that I can change my mind about purchases.

**Acceptance Criteria**:
- [x] User can remove single item from cart
- [x] User can clear entire cart
- [x] Confirm before clearing cart
- [x] Subtotal recalculated
- [x] Cart updates immediately

**Business Rules**:
- Remove action: item deleted from cart
- Clear action: all items deleted
- No undo (re-add manually if needed)

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| cart_item_id | UUID | Valid cart item ID (for single remove) | No |

**Dependencies**:
- FR-OC-001: Add to Cart

**Related API Endpoints**:
- DELETE /api/cart/items/{id}
- DELETE /api/cart/clear

**Related Database Tables**:
- cart_items

---

#### FR-OC-004: Calculate Cart Subtotal

**Priority**: High  
**Status**: Draft

**Description**:
System calculates cart subtotal including item prices and quantities.

**User Story**:
As a beneficiary, I want to see my cart total, so that I know how much I'll spend.

**Acceptance Criteria**:
- [x] Cart shows subtotal (before discounts)
- [x] Subtotal calculated: sum(price × quantity)
- [x] Updates in real-time as cart changes
- [x] Shows currency (IDR)
- [x] Formatted with thousand separators

**Business Rules**:
- Subtotal = Σ(price × quantity)
- No discounts applied yet
- Voucher discount shown separately

**Input Validation**:
No validation (read-only)

**Dependencies**:
- FR-OC-001: Add to Cart

**Related API Endpoints**:
- GET /api/cart/summary

**Related Database Tables**:
- cart_items
- products

---

#### FR-OC-005: Calculate Voucher Eligible Amount

**Priority**: High  
**Status**: Draft

**Description**:
System calculates how much of the cart subtotal is eligible for voucher redemption.

**User Story**:
As a beneficiary, I want to see which part of my cart can be paid with voucher, so that I know my out-of-pocket cost.

**Acceptance Criteria**:
- [x] Cart shows eligible subtotal (nutrition products only)
- [x] Cart shows ineligible items (non-nutrition products)
- [x] Shows amount voucher can cover
- [x] Shows amount user must pay (cash)
- [x] Highlights ineligible items
- [x] Real-time updates as cart changes

**Business Rules**:
- Eligible categories: staples, proteins, dairy, fruits, vegetables, fortified
- Non-eligible: alcohol, tobacco, non-food items
- Voucher covers up to 100% of eligible items
- User pays for ineligible items in cash

**Input Validation**:
No validation (read-only)

**Dependencies**:
- FR-VS-003: Check Voucher Eligibility
- FR-OC-004: Calculate Cart Subtotal

**Related API Endpoints**:
- GET /api/cart/eligibility

**Related Database Tables**:
- cart_items
- products
- voucher_allowed_categories

---

#### FR-OC-006: Create Order

**Priority**: High  
**Status**: Draft

**Description**:
Users can create an order from their cart, optionally applying a voucher for payment.

**User Story**:
As a beneficiary, I want to place an order, so that I can receive my products.

**Acceptance Criteria**:
- [x] User can review cart before checkout
- [x] User can apply voucher code
- [x] Show order summary: subtotal, discount, total
- [x] Show shipping/delivery options (future)
- [x] Select payment method (voucher only, voucher + cash)
- [x] Confirm order
- [x] Order created with "pending" status
- [x] Voucher redeemed if used
- [x] Stock deducted immediately
- [x] Order confirmation sent

**Business Rules**:
- Minimum order: Rp 10.000 (after voucher discount)
- Maximum order per day: 5 transactions
- Order cancellation: within 30 minutes of creation
- Voucher redemption atomic with order creation
- Stock deducted immediately (reservation)

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| voucher_code | string | 16 chars (optional) | No |
| delivery_address | object | Address details | Yes |
| notes | text | Max 500 chars | No |

**Error Handling**:
- Empty cart: "Your cart is empty"
- Below minimum: "Order must be at least Rp 10.000"
- Daily limit reached: "You've reached the daily order limit"
- Invalid voucher: "Invalid voucher code"
- Insufficient voucher balance: "Voucher balance insufficient"

**Dependencies**:
- FR-VS-005: Redeem Voucher
- FR-OC-005: Calculate Voucher Eligible Amount

**Related API Endpoints**:
- POST /api/orders
- GET /api/orders/{id}

**Related Database Tables**:
- orders
- order_items
- vouchers
- product_stock

---

#### FR-OC-007: Apply Voucher Discount

**Priority**: High  
**Status**: Draft

**Description**:
Users can apply voucher codes during checkout to receive discount on eligible items.

**User Story**:
As a beneficiary, I want to apply my voucher, so that I can pay less for my order.

**Acceptance Criteria**:
- [x] User can enter voucher code during checkout
- [x] System validates voucher code
- [x] Show voucher amount and expiration
- [x] Calculate discount: min(voucher balance, eligible subtotal)
- [x] Show new order total
- [x] Show out-of-pocket amount (if any)
- [x] Voucher can be removed before order confirmation
- [x] Multiple vouchers: cannot use more than 1 per order

**Business Rules**:
- 1 voucher per order
- Discount = min(voucher balance, eligible subtotal)
- Voucher locked for 5 minutes during checkout
- If order not confirmed, voucher lock released
- Voucher balance deducted on order confirmation

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| voucher_code | string | 16 chars alphanumeric | Yes |

**Error Handling**:
- Invalid code: "Invalid voucher code"
- Voucher expired: "This voucher has expired"
- Insufficient balance: "Voucher balance insufficient"
- Voucher locked: "This voucher is currently in use. Please try again later"
- Already applied: "Voucher already applied to order"

**Dependencies**:
- FR-VS-004: Validate Voucher Code
- FR-VS-003: Check Voucher Eligibility

**Related API Endpoints**:
- POST /api/orders/apply-voucher
- DELETE /api/orders/remove-voucher

**Related Database Tables**:
- vouchers
- orders

---

#### FR-OC-008: Process Cash Payment

**Priority**: Medium  
**Status**: Draft

**Description**:
Users can pay cash for non-eligible items or when voucher doesn't cover full order amount.

**User Story**:
As a beneficiary, I want to pay cash for ineligible items, so that I can complete my order.

**Acceptance Criteria**:
- [x] Show cash amount needed (total - voucher discount)
- [x] User can select cash payment method (QRIS, bank transfer, COD)
- [x] Process cash payment through payment gateway
- [x] Payment confirmation shown
- [x] Order status updated to "paid"

**Business Rules**:
- Cash payment methods: QRIS, bank transfer, COD (future)
- Minimum cash payment: Rp 10.000
- Payment gateway fee: 1.5% (absorbed by platform)
- Payment timeout: 30 minutes

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| payment_method | enum | qris, va, cod | Yes |

**Error Handling**:
- Payment failed: "Payment failed. Please try again"
- Payment timeout: "Payment expired. Please try again"

**Dependencies**:
- FR-DM-004: Process Payment

**Related API Endpoints**:
- POST /api/orders/{id}/pay-cash
- POST /api/payments/process

**Related Database Tables**:
- orders
- payment_transactions

---

#### FR-OC-009: Order Status Tracking

**Priority**: High  
**Status**: Draft

**Description**:
Users can track their order status through various stages from pending to delivered.

**User Story**:
As a beneficiary, I want to track my order status, so that I know when to expect my products.

**Acceptance Criteria**:
- [x] User can view order status
- [x] Status history shown with timestamps
- [x] Status steps: pending → confirmed → preparing → ready → delivered
- [x] Visual progress indicator
- [x] Estimated delivery time shown
- [x] Notifications sent on status changes
- [x] Real-time status updates (future: via Supabase Realtime)

**Business Rules**:
- Order statuses:
  - pending: Order created, awaiting confirmation
  - confirmed: Order confirmed by vendor
  - preparing: Vendor preparing products
  - ready: Products ready for pickup/delivery
  - delivered: Products delivered
  - cancelled: Order cancelled
- Status update time: within 5 minutes
- Notifications: email + in-app

**Input Validation**:
No validation (read-only)

**Dependencies**:
- FR-OC-006: Create Order

**Related API Endpoints**:
- GET /api/orders/{id}/status
- GET /api/orders/{id}/tracking

**Related Database Tables**:
- orders
- order_status_history

---

#### FR-OC-010: Cancel Order

**Priority**: Medium  
**Status**: Draft

**Description**:
Users can cancel orders within a specific timeframe after creation.

**User Story**:
As a beneficiary, I want to cancel my order, so that I can change my mind or correct mistakes.

**Acceptance Criteria**:
- [x] User can cancel order from order details page
- [x] Cancellation only allowed within 30 minutes
- [x] System shows if cancellation is allowed
- [x] User confirms cancellation
- [x] User provides cancellation reason
- [x] Voucher refunded if used
- [x] Stock returned
- [x] Notification sent to vendor
- [x] Cancellation confirmation shown

**Business Rules**:
- Cancellation window: 30 minutes after order creation
- Cancellation reasons: changed mind, wrong items, other
- Voucher refund: full amount returned
- Stock refund: quantities added back
- Vendor notification: immediate

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| reason | enum | changed_mind, wrong_items, other | Yes |
| notes | text | Max 500 chars | No |

**Error Handling**:
- Too late to cancel: "Order cannot be cancelled. Please contact vendor."
- Already cancelled: "Order has already been cancelled"
- Already delivered: "Order has been delivered"

**Dependencies**:
- FR-OC-009: Order Status Tracking

**Related API Endpoints**:
- POST /api/orders/{id}/cancel

**Related Database Tables**:
- orders (status, cancelled_at, cancellation_reason)
- vouchers
- product_stock

---

#### FR-OC-011: View Order History

**Priority**: High  
**Status**: Draft

**Description**:
Users can view their complete order history with filtering and pagination.

**User Story**:
As a beneficiary, I want to see my order history, so that I can track my purchases.

**Acceptance Criteria**:
- [x] User can view list of all orders
- [x] Each order shows: date, status, total, items
- [x] Filter by status
- [x] Filter by date range
- [x] Sort by date, total
- [x] Pagination (20 items per page)
- [x] Click order to view details
- [x] Export to CSV

**Business Rules**:
- History shows all time (no limit)
- Filter options: pending, confirmed, preparing, ready, delivered, cancelled
- Real-time updates
- Export: last 12 months

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| status | enum | pending, confirmed, preparing, ready, delivered, cancelled | No |
| start_date | date | Valid date | No |
| end_date | date | Valid date, after start_date | No |
| page | number | Positive integer | No |
| limit | number | Positive integer, max 100 | No |

**Error Handling**:
- No orders: "No orders found"

**Dependencies**:
- FR-OC-006: Create Order

**Related API Endpoints**:
- GET /api/orders
- GET /api/orders/export

**Related Database Tables**:
- orders
- order_items

---

#### FR-OC-012: View Order Details

**Priority**: High  
**Status**: Draft

**Description**:
Users can view detailed information about a specific order.

**User Story**:
As a beneficiary, I want to see order details, so that I can review what I purchased.

**Acceptance Criteria**:
- [x] View complete order information
- [x] Shows: order ID, date, status, total
- [x] Shows all items with quantity and price
- [x] Shows voucher discount (if applied)
- [x] Shows delivery address
- [x] Shows payment method
- [x] Shows vendor information
- [x] Shows order status history
- [x] Can cancel if within 30 minutes
- [x] Can contact vendor (future)

**Business Rules**:
- Order details: all information except sensitive
- Status history: complete with timestamps
- Vendor info: name, address, phone (if order ready/delivered)

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| order_id | UUID | Valid order ID | Yes |

**Error Handling**:
- Order not found: "Order not found"
- Access denied: "You don't have access to this order"

**Dependencies**:
- FR-OC-011: View Order History

**Related API Endpoints**:
- GET /api/orders/{id}

**Related Database Tables**:
- orders
- order_items
- order_status_history

---

## 3.6 FIES Survey

This module covers the Food Insecurity Experience Scale survey for assessing food insecurity levels.

---

#### FR-FS-001: View Survey Questions

**Priority**: High  
**Status**: Draft

**Description**:
Beneficiaries can view the 8-question FIES survey based on FAO guidelines.

**User Story**:
As a beneficiary, I want to see the FIES survey questions, so that I can complete the assessment.

**Acceptance Criteria**:
- [x] User can view 8 FIES survey questions
- [x] Questions in Indonesian
- [x] Each question has "Yes/No" options
- [x] Questions are numbered 1-8
- [x] Survey description explains purpose
- [x] Estimated completion time shown (2-3 minutes)
- [x] Show last survey completion date
- [x] Questions accessible one at a time or all at once

**Business Rules**:
- FIES survey: FAO 8-question standard
- Response options: Yes (1), No (0)
- Questions progressively assess severity
- Survey must be completed monthly
- Questions in Bahasa Indonesia

**Survey Questions**:
1. During the last 12 months, were there times when you were worried you would not have enough food to eat because of a lack of money or other resources?
2. During the last 12 months, were there times when you were unable to eat healthy and nutritious food because of a lack of money or other resources?
3. During the last 12 months, were there times when you ate only a few kinds of foods because of a lack of money or other resources?
4. During the last 12 months, were there times when you had to skip a meal because there was not enough food in the house?
5. During the last 12 months, were there times when you ate less than you thought you should because of a lack of money or other resources?
6. During the last 12 months, were there times when your household ran out of food because of a lack of money or other resources?
7. During the last 12 months, were there times when you were hungry but did not eat because there was not enough food in the house?
8. During the last 12 months, were there times when you went a whole day and night without eating anything because there was not enough food in the house?

**Input Validation**:
No validation (read-only)

**Dependencies**:
- FR-AM-003: Login/Logout

**Related API Endpoints**:
- GET /api/fies/survey

**Related Database Tables**:
- fies_questions

---

#### FR-FS-002: Submit Survey Answers

**Priority**: High  
**Status**: Draft

**Description**:
Beneficiaries submit their FIES survey responses which are scored to determine food insecurity level.

**User Story**:
As a beneficiary, I want to submit my survey answers, so that my food insecurity can be assessed.

**Acceptance Criteria**:
- [x] User can answer each question
- [x] Answers saved as user progresses
- [x] Can save as draft and return later
- [x] Submit when all 8 questions answered
- [x] FIES score calculated automatically
- [x] Food insecurity level determined
- [x] Result shown immediately
- [x] Survey completion date recorded
- [x] Notification sent on submission

**Business Rules**:
- All 8 questions must be answered
- Score calculation: Sum of "Yes" responses
- Score range: 0-8
- Score interpretation:
  - 0: Food Secure
  - 1-2: Mild Food Insecurity
  - 3-5: Moderate Food Insecurity
  - 6-8: Severe Food Insecurity
- One survey per month (can retake but last submission counted)
- Results used for voucher allocation priority

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| answers | array | 8 responses, each Yes/No | Yes |

**Error Handling**:
- Incomplete survey: "Please answer all 8 questions"
- Already submitted this month: "You've already completed the survey this month"

**Dependencies**:
- FR-FS-001: View Survey Questions

**Related API Endpoints**:
- POST /api/fies/submit
- POST /api/fies/save-draft

**Related Database Tables**:
- fies_responses
- fies_scores
- beneficiaries

---

#### FR-FS-003: Calculate FIES Score

**Priority**: High  
**Status**: Draft

**Description**:
System calculates FIES score based on survey responses to determine food insecurity level.

**User Story**:
As system, I want to calculate the FIES score, so that beneficiaries can be classified by need level.

**Acceptance Criteria**:
- [x] Score calculated from survey responses
- [x] "Yes" responses = 1 point
- [x] "No" responses = 0 points
- [x] Score = sum of all "Yes" responses
- [x] Score range: 0-8
- [x] Score saved to beneficiary profile
- [x] Food insecurity level determined
- [x] Score history maintained

**Business Rules**:
- Scoring method: FAO standard
- Higher score = more severe insecurity
- Score used for:
  - Voucher allocation priority
  - Nutrition recommendations
  - Government analytics
- Score history tracked over time

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| answers | array | 8 responses | Yes |

**Dependencies**:
- FR-FS-002: Submit Survey Answers

**Related API Endpoints**:
- POST /api/fies/calculate

**Related Database Tables**:
- fies_scores
- beneficiaries

---

#### FR-FS-004: Determine Food Insecurity Level

**Priority**: High  
**Status**: Draft

**Description**:
System classifies beneficiaries into food insecurity levels based on FIES score.

**User Story**:
As beneficiary, I want to know my food insecurity level, so that I can understand my situation.

**Acceptance Criteria**:
- [x] Food insecurity level shown to user
- [x] Level description explains meaning
- [x] Level shown with visual indicator (color-coded)
- [x] Level comparison: current vs previous
- [x] Recommendations provided based on level
- [x] Level used for voucher priority

**Business Rules**:
- Food Insecurity Levels:
  - Level 0: Food Secure (Score 0) - Green
  - Level 1: Mild Food Insecurity (Score 1-2) - Yellow
  - Level 2: Moderate Food Insecurity (Score 3-5) - Orange
  - Level 3: Severe Food Insecurity (Score 6-8) - Red
- Voucher allocation priority:
  - Severe (Level 3): Highest priority
  - Moderate (Level 2): High priority
  - Mild (Level 1): Medium priority
  - Secure (Level 0): Lowest priority

**Input Validation**:
No validation (read-only)

**Dependencies**:
- FR-FS-003: Calculate FIES Score

**Related API Endpoints**:
- GET /api/fies/level

**Related Database Tables**:
- beneficiaries
- fies_scores

---

#### FR-FS-005: View Survey History

**Priority**: Medium  
**Status**: Draft

**Description**:
Beneficiaries can view their FIES survey history including scores and trends over time.

**User Story**:
As a beneficiary, I want to see my survey history, so that I can track my food insecurity over time.

**Acceptance Criteria**:
- [x] User can view survey history
- [x] Each entry shows: date, score, level
- [x] Sort by date (newest first)
- [x] Filter by date range
- [x] Trend chart showing score over time
- [x] Compare current vs previous scores
- [x] Export to CSV

**Business Rules**:
- History: all surveys submitted
- Chart: line graph showing score trends
- Minimum data for trend: 3 surveys
- Improving trend: score decreasing
- Worsening trend: score increasing

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| start_date | date | Valid date | No |
| end_date | date | Valid date, after start_date | No |
| page | number | Positive integer | No |

**Error Handling**:
- No history: "No survey history available"

**Dependencies**:
- FR-FS-004: Determine Food Insecurity Level

**Related API Endpoints**:
- GET /api/fies/history
- GET /api/fies/trends

**Related Database Tables**:
- fies_scores
- beneficiaries

---

#### FR-FS-006: Monthly Reminder

**Priority**: Medium  
**Status**: Draft

**Description**:
System sends monthly reminders to beneficiaries to complete their FIES survey.

**User Story**:
As a beneficiary, I want to be reminded to complete my survey, so that I don't miss the monthly requirement.

**Acceptance Criteria**:
- [x] Reminder sent monthly
- [x] First reminder: 1 week after last survey
- [x] Second reminder: 1 day before deadline
- [x] Reminder sent via email and in-app notification
- [x] Reminder shows link to survey
- [x] Reminder can be disabled (user preference)
- [x] Tracking of reminder delivery

**Business Rules**:
- Survey cycle: monthly
- Last survey date used for next reminder
- User can disable reminders (not recommended)
- Reminder frequency: max 2 per month

**Input Validation**:
No validation (automated)

**Dependencies**:
- FR-NT-004: Email Notifications

**Related API Endpoints**:
- POST /api/notifications/reminders/fies

**Related Database Tables**:
- notification_reminders
- beneficiaries

---

#### FR-FS-007: One Survey Per Month

**Priority**: Medium  
**Status**: Draft

**Description**:
System enforces one survey per month per beneficiary to maintain data consistency.

**User Story**:
As system, I want to enforce one survey per month, so that survey data is consistent and reliable.

**Acceptance Criteria**:
- [x] User can only submit one survey per month
- [x] Last submission date checked before allowing new submission
- [x] User can retake survey (overwrites previous)
- [x] Warning shown if retaking
- [x] Survey period: calendar month
- [x] Last submission date shown
- [x] Admin can override (exceptional cases)

**Business Rules**:
- One survey per calendar month
- Survey period: 1st to last day of month
- Retake allowed but overwrites previous submission
- Survey not tied to specific day (flexible timing)
- Exceptional cases: admin can reset

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| override | boolean | Admin only | No |

**Error Handling**:
- Already submitted: "You've already completed the survey this month"
- Retake warning: "This will overwrite your previous submission. Continue?"

**Dependencies**:
- FR-FS-002: Submit Survey Answers

**Related API Endpoints**:
- POST /api/admin/fies/override

**Related Database Tables**:
- fies_scores
- beneficiaries

---

## 3.7 Nutrition Monitoring

This module covers child growth monitoring using WHO standards and Z-score calculations.

---

#### FR-NM-001: Register Child

**Priority**: High  
**Status**: Draft

**Description**:
Beneficiaries can register their children for growth monitoring and tracking.

**User Story**:
As a parent, I want to register my child, so that I can track their growth and nutrition.

**Acceptance Criteria**:
- [x] User can register child details
- [x] Fields: name, date of birth, gender
- [x] Date of birth validation (not future, reasonable age)
- [x] Gender selection (male, female)
- [x] Child added to beneficiary profile
- [x] Unique child ID generated
- [x] User can register multiple children

**Business Rules**:
- Max children per beneficiary: 10
- Age range: 0-5 years (WHO standards)
- Gender: male, female
- Child must be family member (KTP/KK verification)

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| name | string | Min 2 chars, max 100 chars | Yes |
| date_of_birth | date | Valid date, not future, age 0-5 years | Yes |
| gender | enum | male, female | Yes |
| relationship | enum | child, sibling, ward | Yes |

**Error Handling**:
- Invalid date of birth: "Invalid date of birth"
- Age out of range: "Child must be between 0-5 years old"
- Max children reached: "Maximum 10 children allowed"

**Dependencies**:
- FR-AM-005: Profile Management

**Related API Endpoints**:
- POST /api/nutrition/children
- GET /api/nutrition/children

**Related Database Tables**:
- children
- beneficiaries

---

#### FR-NM-002: Record Growth Data

**Priority**: High  
**Status**: Draft

**Description**:
Beneficiaries can record growth measurements (height, weight) for their children.

**User Story**:
As a parent, I want to record my child's growth data, so that I can track their development.

**Acceptance Criteria**:
- [x] User can select child from registered list
- [x] Enter measurement date
- [x] Enter height (cm)
- [x] Enter weight (kg)
- [x] Date validation: not future, reasonable range
- [x] Measurements saved to child's growth record
- [x] Z-scores calculated automatically
- [x] Nutritional status determined
- [x] Growth chart updated

**Business Rules**:
- Measurement frequency: at least once per month recommended
- Height range: 40-120 cm (age-dependent)
- Weight range: 2-25 kg (age-dependent)
- Age at measurement: used for WHO standards
- Z-scores: calculated based on age, height, weight
- Growth chart: plotted with historical data

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| child_id | UUID | Valid child ID | Yes |
| measurement_date | date | Valid date, not future | Yes |
| height | number | Positive, 40-120 cm | Yes |
| weight | number | Positive, 2-25 kg | Yes |

**Error Handling**:
- Child not found: "Child not found"
- Invalid measurement date: "Measurement date cannot be in the future"
- Height out of range: "Height must be between 40-120 cm"
- Weight out of range: "Weight must be between 2-25 kg"

**Dependencies**:
- FR-NM-001: Register Child

**Related API Endpoints**:
- POST /api/nutrition/measurements
- GET /api/nutrition/measurements/{child_id}

**Related Database Tables**:
- growth_measurements
- children
- z_scores

---

#### FR-NM-003: Calculate Z-Score (WHO)

**Priority**: High  
**Status**: Draft

**Description**:
System calculates WHO Z-scores for height-for-age (HAZ), weight-for-age (WAZ), and weight-for-height (WHZ).

**User Story**:
As system, I want to calculate Z-scores, so that I can assess child nutritional status.

**Acceptance Criteria**:
- [x] HAZ calculated (Height-for-Age Z-Score)
- [x] WAZ calculated (Weight-for-Age Z-Score)
- [x] WHZ calculated (Weight-for-Height Z-Score)
- [x] Calculations based on WHO growth standards
- [x] Age in months used for calculation
- [x] Results saved to child's record
- [x] Z-scores shown in growth dashboard

**Business Rules**:
- WHO growth standards: 2006 standards
- HAZ: compares height to age norms
- WAZ: compares weight to age norms
- WHZ: compares weight to height norms
- Z-score interpretation:
  - <-3: Severely underweight/stunted/wasted
  - -3 to <-2: Moderately underweight/stunted/wasted
  - -2 to +2: Normal
  - >+2: Overweight/tall
- Calculations use age in months
- Age in months = (date_of_birth - measurement_date) / 30.44

**Input Validation**:
No validation (calculated from measurements)

**Dependencies**:
- FR-NM-002: Record Growth Data

**Related API Endpoints**:
- POST /api/nutrition/calculate-zscore

**Related Database Tables**:
- z_scores
- growth_measurements
- who_growth_standards

---

#### FR-NM-004: Determine Nutritional Status

**Priority**: High  
**Status**: Draft

**Description**:
System determines child's nutritional status based on Z-scores.

**User Story**:
As a parent, I want to know my child's nutritional status, so that I can take appropriate action.

**Acceptance Criteria**:
- [x] Nutritional status shown for child
- [x] Status based on Z-scores
- [x] Status categories: stunted, underweight, wasted, normal, overweight
- [x] Visual indicator (color-coded)
- [x] Status explanation provided
- [x] Recommendations based on status
- [x] Status history tracked

**Business Rules**:
- Nutritional Status Determination:
  - Stunted: HAZ < -2 (short for age)
  - Underweight: WAZ < -2 (low weight for age)
  - Wasted: WHZ < -2 (low weight for height)
  - Overweight: WAZ > +2 or WHZ > +2
  - Normal: All z-scores ≥ -2 and ≤ +2
- Severity levels:
  - Severe: Z-score < -3
  - Moderate: Z-score -3 to -2
- Alert status if any z-score < -2
- Recommendations provided for abnormal status

**Input Validation**:
No validation (determined from Z-scores)

**Dependencies**:
- FR-NM-003: Calculate Z-Score

**Related API Endpoints**:
- GET /api/nutrition/status/{child_id}

**Related Database Tables**:
- children
- z_scores

---

#### FR-NM-005: View Growth Chart

**Priority**: Medium  
**Status**: Draft

**Description**:
Beneficiaries can view growth charts showing their child's growth over time.

**User Story**:
As a parent, I want to see my child's growth chart, so that I can visualize their development.

**Acceptance Criteria**:
- [x] Growth chart displayed for child
- [x] Charts: height-for-age, weight-for-age, weight-for-height
- [x] WHO reference curves shown
- [x] Child's data plotted on chart
- [x] Time range: 3 months, 6 months, 1 year, all time
- [x] Hover shows data points
- [x] Export chart as image
- [x] Print option

**Business Rules**:
- Chart type: line graph
- Reference curves: WHO standards (0-5 years)
- Data points: all measurements
- X-axis: age in months
- Y-axis: height (cm) or weight (kg)
- Visual indicators for abnormal growth

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| chart_type | enum | haz, waz, whz | Yes |
| time_range | enum | 3m, 6m, 1y, all | No |

**Error Handling**:
- No data: "No growth data available for this child"

**Dependencies**:
- FR-NM-002: Record Growth Data

**Related API Endpoints**:
- GET /api/nutrition/chart/{child_id}

**Related Database Tables**:
- growth_measurements
- z_scores
- who_growth_standards

---

#### FR-NM-006: Alert for Abnormal Growth

**Priority**: High  
**Status**: Draft

**Description**:
System alerts beneficiaries when child's Z-scores indicate abnormal growth.

**User Story**:
As a parent, I want to be alerted if my child has abnormal growth, so that I can take action.

**Acceptance Criteria**:
- [x] Alert shown when z-score < -2
- [x] Alert indicates type: stunted, underweight, wasted
- [x] Alert severity: moderate (-3 to -2), severe (< -3)
- [x] Alert shown in dashboard
- [x] Notification sent (email + in-app)
- [x] Alert includes recommendations
- [x] Alert history maintained
- [x] Alert cleared when measurement improves

**Business Rules**:
- Alert trigger: any z-score < -2
- Alert severity:
  - Moderate: -3 to -2
  - Severe: < -3
- Alert types:
  - Stunted (HAZ < -2)
  - Underweight (WAZ < -2)
  - Wasted (WHZ < -2)
- Notification sent immediately on measurement entry
- Alert cleared when z-score ≥ -2
- Recommendations: consult health worker, improve nutrition

**Input Validation**:
No validation (automatic based on Z-scores)

**Dependencies**:
- FR-NM-004: Determine Nutritional Status

**Related API Endpoints**:
- GET /api/nutrition/alerts
- POST /api/nutrition/alerts/{id}/dismiss

**Related Database Tables**:
- nutrition_alerts
- z_scores

---

#### FR-NM-007: Multiple Children Support

**Priority**: Medium  
**Status**: Draft

**Description**:
Beneficiaries can track growth data for multiple children.

**User Story**:
As a parent with multiple children, I want to track all of their growth, so that I can monitor each child.

**Acceptance Criteria**:
- [x] User can register multiple children
- [x] List of children shown in profile
- [x] Switch between children to view data
- [x] Each child has separate growth record
- [x] Comparison view: side-by-side charts
- [x] Max children: 10
- [x] Child profile view: summary of all children

**Business Rules**:
- Max children: 10 per beneficiary
- Each child: independent growth record
- Dashboard: switchable child selector
- Comparison view: available for 2-4 children
- Profile: shows summary of all children

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| children_ids | array | Valid child UUIDs, max 10 | Yes |

**Error Handling**:
- Max children reached: "Maximum 10 children allowed"

**Dependencies**:
- FR-NM-001: Register Child

**Related API Endpoints**:
- GET /api/nutrition/children
- GET /api/nutrition/children/{id}
- GET /api/nutrition/compare?children={ids}

**Related Database Tables**:
- children
- growth_measurements

---

## 3.8 AI Nutrition Recommendations

This module covers AI-powered nutrition recommendations based on FIES scores and household data.

---

#### FR-NR-001: Generate Recommendations

**Priority**: Medium  
**Status**: Draft

**Description**:
System generates personalized nutrition recommendations based on beneficiary's FIES score, household composition, and child growth data.

**User Story**:
As a beneficiary, I want to receive nutrition recommendations, so that I can improve my family's nutrition.

**Acceptance Criteria**:
- [x] System generates recommendations automatically
- [x] Based on: FIES score, household size, child ages, growth data
- [x] Recommendations prioritized by importance
- [x] Recommendations shown in dashboard
- [x] Each recommendation: product suggestions, quantity, justification
- [x] Generated after survey completion
- [x] Updated monthly with new survey data

**Business Rules**:
- Recommendation engine: rule-based (if-else)
- Priority factors: FIES score, child malnutrition alerts
- Product categories: staples, proteins, dairy, fruits, vegetables, fortified
- Recommendation count: 3-5 products
- Refresh frequency: monthly after FIES survey

**Input Validation**:
No validation (automatic)

**Dependencies**:
- FR-FS-004: Determine Food Insecurity Level
- FR-NM-004: Determine Nutritional Status

**Related API Endpoints**:
- GET /api/recommendations
- POST /api/recommendations/generate

**Related Database Tables**:
- recommendations
- beneficiaries
- children

---

#### FR-NR-002: View Recommendation Packets

**Priority**: Medium  
**Status**: Draft

**Description**:
Beneficiaries can view their personalized recommendation packets with product suggestions.

**User Story**:
As a beneficiary, I want to see my recommendations, so that I can choose products to buy.

**Acceptance Criteria**:
- [x] Recommendations shown in dashboard
- [x] Each recommendation packet: priority level, products, total cost
- [x] Products: image, name, price, nutrition info
- [x] Show estimated impact on nutrition
- [x] Filter by category
- [x] Sort by priority, price
- [x] Add recommendation packet to cart

**Business Rules**:
- Recommendation packets: High, Medium, Low priority
- Packet contains: 3-5 products
- Packet cost: fits within voucher balance
- Estimated duration: 1-2 weeks of meals
- Priority: based on FIES score and growth alerts

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| priority | enum | high, medium, low | No |

**Dependencies**:
- FR-NR-001: Generate Recommendations

**Related API Endpoints**:
- GET /api/recommendations/packets

**Related Database Tables**:
- recommendation_packets
- recommendations

---

#### FR-NR-003: Custom Recommendation

**Priority**: Low  
**Status**: Draft

**Description**:
Beneficiaries can request custom recommendations for specific needs (e.g., dietary restrictions, allergies).

**User Story**:
As a beneficiary with special dietary needs, I want custom recommendations, so that I can get appropriate products.

**Acceptance Criteria**:
- [x] User can request custom recommendations
- [x] Specify dietary restrictions (vegetarian, halal, gluten-free)
- [x] Specify allergies (nuts, dairy, etc.)
- [x] Specify preferences (organic, low-sodium)
- [x] Admin reviews request
- [x] Custom recommendations generated within 24 hours
- [x] User notified when ready

**Business Rules**:
- Custom requests: reviewed by admin
- Response time: 24 hours
- Priority queue based on FIES score
- Custom recommendations override standard recommendations
- Restrictions documented in beneficiary profile

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| dietary_restrictions | array | Valid restriction enums | No |
| allergies | array | Valid allergy enums | No |
| preferences | array | Valid preference enums | No |
| notes | text | Max 500 chars | No |

**Error Handling**:
- Invalid restriction: "Invalid dietary restriction"
- Invalid allergy: "Invalid allergy"

**Dependencies**:
- FR-NR-001: Generate Recommendations

**Related API Endpoints**:
- POST /api/recommendations/custom
- GET /api/recommendations/custom/{id}

**Related Database Tables**:
- custom_recommendations
- beneficiaries

---

#### FR-NR-004: Mark Recommendation as Adopted

**Priority**: Low  
**Status**: Draft

**Description**:
Beneficiaries can mark recommendations as adopted if they purchased recommended products.

**User Story**:
As a beneficiary, I want to mark recommendations as adopted, so that I can track what I've implemented.

**Acceptance Criteria**:
- [x] User can mark recommendation as adopted
- [x] Select from recent orders
- [x] Adoption date recorded
- [x] Adoption status shown in recommendation history
- [x] Impact tracked (nutrition improvement)
- [x] Feedback collection (did recommendation help?)

**Business Rules**:
- Adoption: user confirms they purchased recommended products
- Adoption window: within 30 days of recommendation
- Feedback: optional but encouraged
- Adoption used to improve recommendation algorithm

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| recommendation_id | UUID | Valid recommendation ID | Yes |
| order_id | UUID | Valid order ID | Yes |
| feedback | enum | helpful, somewhat_helpful, not_helpful | Yes |
| notes | text | Max 500 chars | No |

**Error Handling**:
- Recommendation not found: "Recommendation not found"
- Invalid order: "Order not found or doesn't match recommendation"

**Dependencies**:
- FR-NR-002: View Recommendation Packets
- FR-OC-011: View Order History

**Related API Endpoints**:
- POST /api/recommendations/{id}/adopt
- GET /api/recommendations/adopted

**Related Database Tables**:
- recommendation_adoptions
- recommendations

---

#### FR-NR-005: Recommendation Priority

**Priority**: Medium  
**Status**: Draft

**Description**:
System prioritizes recommendations based on beneficiary needs and urgency.

**User Story**:
As a beneficiary, I want to see the most important recommendations first, so that I can address urgent needs.

**Acceptance Criteria**:
- [x] Recommendations sorted by priority
- [x] Priority levels: Critical, High, Medium, Low
- [x] Priority based on: FIES score, growth alerts, household needs
- [x] Critical recommendations: highlighted
- [x] Priority shown visually (color-coded)

**Business Rules**:
- Priority Levels:
  - Critical: Severe food insecurity (FIES 6-8) OR severe growth alerts
  - High: Moderate food insecurity (FIES 3-5) OR moderate growth alerts
  - Medium: Mild food insecurity (FIES 1-2)
  - Low: Food secure (FIES 0)
- Critical recommendations: shown first, highlighted
- Priority recalculated monthly

**Input Validation**:
No validation (automatic)

**Dependencies**:
- FR-FS-004: Determine Food Insecurity Level
- FR-NM-006: Alert for Abnormal Growth

**Related API Endpoints**:
- GET /api/recommendations?priority=high

**Related Database Tables**:
- recommendations
- beneficiaries
- children

---

## 3.9 Vendor Settlement

This module covers vendor settlement requests, approvals, and payouts.

---

#### FR-VS-001: View Settlement Summary

**Priority**: High  
**Status**: Draft

**Description**:
Vendors can view their settlement summary including total redeemed, commission deducted, and net payable amount.

**User Story**:
As a vendor, I want to see my settlement summary, so that I know how much I can withdraw.

**Acceptance Criteria**:
- [x] User can view settlement summary
- [x] Shows: total redeemed, commission, net amount
- [x] Shows: settlement period (7 days min)
- [x] Shows: pending settlements (if any)
- [x] Shows: last settlement date and amount
- [x] Real-time updates
- [x] Currency: IDR
- [x] Formatted with thousand separators

**Business Rules**:
- Settlement period: minimum 7 days
- Commission rate: 5% of redeemed amount
- Net amount = Total redeemed - Commission
- Pending settlements: shown separately
- Available amount: total redeemed - pending - commission

**Input Validation**:
No validation (read-only)

**Dependencies**:
- FR-VS-005: Redeem Voucher (vendor perspective)

**Related API Endpoints**:
- GET /api/vendor/settlement/summary

**Related Database Tables**:
- vendor_settlements
- voucher_transactions

---

#### FR-VS-002: Request Settlement

**Priority**: High  
**Status**: Draft

**Description**:
Vendors can request settlement (withdrawal) of their redeemed voucher amounts after meeting minimum requirements.

**User Story**:
As a vendor, I want to request a settlement, so that I can withdraw my earnings.

**Acceptance Criteria**:
- [x] User can request settlement
- [x] Shows available amount for withdrawal
- [x] Minimum period check (7 days)
- [x] Minimum amount check (Rp 1.000.000)
- [x] User confirms request
- [x] Settlement status: "pending"
- [x] Notification sent on request
- [x] Estimated payout time: 2-3 business days

**Business Rules**:
- Minimum period: 7 days since last settlement
- Minimum amount: Rp 1.000.000
- Settlement window: daily (can request once per day)
- Processing time: 2-3 business days
- Commission deducted: 5% before payout

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| amount | number | Min 1.000.000, <= available balance | Yes |
| bank_account | object | Bank details | Yes |

**Error Handling**:
- Period not met: "Minimum 7 days since last settlement"
- Amount too low: "Minimum settlement amount is Rp 1.000.000"
- Insufficient balance: "Requested amount exceeds available balance"
- Daily limit: "You can only request one settlement per day"

**Dependencies**:
- FR-VS-001: View Settlement Summary

**Related API Endpoints**:
- POST /api/vendor/settlement/request
- GET /api/vendor/settlement/available

**Related Database Tables**:
- vendor_settlements
- vendor_bank_accounts

---

#### FR-VS-003: View Settlement History

**Priority**: Medium  
**Status**: Draft

**Description**:
Vendors can view their complete settlement history including status and amounts.

**User Story**:
As a vendor, I want to see my settlement history, so that I can track my earnings.

**Acceptance Criteria**:
- [x] User can view settlement history
- [x] Each settlement shows: date, amount, status, commission
- [x] Filter by status (pending, approved, paid, rejected)
- [x] Filter by date range
- [x] Sort by date, amount
- [x] Pagination (20 items per page)
- [x] Download settlement report (PDF/Excel)

**Business Rules**:
- Settlement statuses: pending, approved, paid, rejected
- History: all settlements
- Export: PDF for printing, Excel for accounting
- Real-time status updates

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| status | enum | pending, approved, paid, rejected | No |
| start_date | date | Valid date | No |
| end_date | date | Valid date, after start_date | No |
| page | number | Positive integer | No |

**Error Handling**:
- No settlements: "No settlement history found"

**Dependencies**:
- FR-VS-002: Request Settlement

**Related API Endpoints**:
- GET /api/vendor/settlements
- GET /api/vendor/settlements/export

**Related Database Tables**:
- vendor_settlements

---

#### FR-VS-004: Download Settlement Report

**Priority**: Medium  
**Status**: Draft

**Description**:
Vendors can download detailed settlement reports for accounting purposes.

**User Story**:
As a vendor, I want to download settlement reports, so that I can use them for accounting.

**Acceptance Criteria**:
- [x] User can download settlement report
- [x] Formats: PDF, Excel
- [x] Report includes: detailed transactions, commission, net amount
- [x] Report covers specified date range
- [x] Report includes vendor information
- [x] NutriGuard branding on reports
- [x] Download link expires after 24 hours

**Business Rules**:
- Report formats: PDF (official), Excel (accounting)
- Report content:
  - Vendor info: name, address, NPWP
  - Settlement summary: total, commission, net
  - Transaction list: date, order ID, amount, commission
  - Payment details: bank account, transfer date
- Report generated on-demand
- Retention: 90 days

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| format | enum | pdf, excel | Yes |
| start_date | date | Valid date | Yes |
| end_date | date | Valid date, after start_date | Yes |

**Error Handling**:
- No data: "No settlement data for selected period"
- Invalid date range: "End date must be after start date"

**Dependencies**:
- FR-VS-003: View Settlement History

**Related API Endpoints**:
- GET /api/vendor/settlements/report
- POST /api/vendor/settlements/generate-report

**Related Database Tables**:
- vendor_settlements
- settlement_reports

---

#### FR-VS-005: Admin Approve Settlement

**Priority**: High  
**Status**: Draft

**Description**:
Admins review and approve vendor settlement requests before payout.

**User Story**:
As an admin, I want to approve settlements, so that vendors receive their payouts.

**Acceptance Criteria**:
- [x] Admin can view pending settlement requests
- [x] View vendor details and bank information
- [x] Review transaction history
- [x] Approve or reject settlement
- [x] Provide rejection reason (if rejecting)
- [x] Batch approve multiple settlements
- [x] Notification sent to vendor on approval/rejection
- [x] Payment initiated on approval
- [x] Settlement status updated

**Business Rules**:
- Approval required before payout
- Review checks:
  - Minimum period met (7 days)
  - Minimum amount met (Rp 1.000.000)
  - Transaction history valid
  - Bank account verified
- Rejection reasons: invalid bank account, suspicious activity, policy violation
- Payment initiated: bank transfer within 24 hours
- Commission deducted automatically

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| settlement_ids | array | Valid settlement UUIDs | Yes |
| action | enum | approve, reject | Yes |
| rejection_reason | text | Min 10 chars (if reject) | Conditional |

**Error Handling**:
- Settlement not found: "Settlement not found"
- Already processed: "Settlement has already been processed"

**Dependencies**:
- FR-VS-002: Request Settlement

**Related API Endpoints**:
- GET /api/admin/settlements/pending
- POST /api/admin/settlements/approve
- POST /api/admin/settlements/reject

**Related Database Tables**:
- vendor_settlements (status, approved_at, approved_by, rejected_at, rejected_reason)
- vendor_bank_accounts

---

#### FR-VS-006: Process Transfer

**Priority**: High  
**Status**: Draft

**Description**:
System processes bank transfers to vendors for approved settlements.

**User Story**:
As system, I want to process transfers, so that vendors receive their payouts.

**Acceptance Criteria**:
- [x] Transfer initiated after admin approval
- [x] Transfer to vendor's registered bank account
- [x] Transfer amount: net settlement amount (after commission)
- [x] Transfer reference number generated
- [x] Settlement status updated to "processing"
- [x] Transfer status tracked (initiated, completed, failed)
- [x] Notification sent to vendor on transfer status
- [x] Failed transfers: retried automatically (3 times)

**Business Rules**:
- Transfer method: bank transfer (BCA, Mandiri, BNI, BRI)
- Transfer timing: within 24 hours of approval
- Reference number format: SETT-YYYYMMDD-XXXXX
- Failed transfers: retried every 24 hours for 3 attempts
- Failed after 3 attempts: marked as "failed", requires admin intervention

**Input Validation**:
No validation (automated)

**Dependencies**:
- FR-VS-005: Admin Approve Settlement

**Related API Endpoints**:
- POST /api/settlements/process-transfer
- GET /api/settlements/{id}/transfer-status

**Related Database Tables**:
- vendor_settlements
- bank_transfers
- vendor_bank_accounts

---

#### FR-VS-007: Minimum Settlement Rules

**Priority**: High  
**Status**: Draft

**Description**:
System enforces minimum settlement rules (period and amount) to ensure efficient processing.

**User Story**:
As system, I want to enforce settlement rules, so that vendor payouts are efficient.

**Acceptance Criteria**:
- [x] Minimum period enforced (7 days)
- [x] Minimum amount enforced (Rp 1.000.000)
- [x] Rules shown to vendors
- [x] Validation before allowing settlement request
- [x] Clear error messages if rules not met
- [x] Rules configurable by admin

**Business Rules**:
- Minimum period: 7 days since last settlement
- Minimum amount: Rp 1.000.000 (after commission)
- Admin can configure: minimum days (3-14), minimum amount (Rp 500.000 - Rp 2.000.000)
- Rules applied automatically
- Exception handling: admin can override for special cases

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| min_days | number | 3-14 | No |
| min_amount | number | 500.000 - 2.000.000 | No |

**Error Handling**:
- Period not met: "Minimum {min_days} days since last settlement"
- Amount not met: "Minimum settlement amount is Rp {min_amount}"

**Dependencies**:
- FR-VS-002: Request Settlement

**Related API Endpoints**:
- GET /api/settlements/rules
- POST /api/admin/settlements/update-rules

**Related Database Tables**:
- settlement_rules
- vendor_settlements

---

## 3.10 Analytics & Reporting

This module covers dashboards and reports for all user roles (donor, beneficiary, vendor, admin, government).

---

#### FR-AR-001: Donor Dashboard Stats

**Priority**: High  
**Status**: Draft

**Description**:
Donors can view their dashboard statistics including donations, impact, and engagement metrics.

**User Story**:
As a donor, I want to see my dashboard stats, so that I can track my giving and impact.

**Acceptance Criteria**:
- [x] Dashboard shows key metrics
- [x] Metrics: total donated, vouchers funded, beneficiaries supported, families fed
- [x] Charts: donation trend over time
- [x] Maps: geographic distribution of beneficiaries
- [x] Time filters: last 7 days, 30 days, 90 days, all time
- [x] Top beneficiaries (anonymized stories)
- [x] Impact comparison vs platform average
- [x] Monthly donation goal progress (if set)

**Business Rules**:
- Data real-time or daily updated
- Anonymized beneficiary stories: no personal info
- Geographic data: province level
- Impact calculation: 1 voucher = 1 family for 2 days
- Donation goal: optional, user can set

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| time_range | enum | 7d, 30d, 90d, all | No |

**Dependencies**:
- FR-DM-007: View Donation History
- FR-DM-009: View Impact Dashboard

**Related API Endpoints**:
- GET /api/donor/dashboard/stats
- GET /api/donor/dashboard/trends

**Related Database Tables**:
- donations
- vouchers
- beneficiaries

---

#### FR-AR-002: Donor Impact Report

**Priority**: Medium  
**Status**: Draft

**Description**:
Donors can generate and download detailed impact reports showing their donations' effect on beneficiaries.

**User Story**:
As a donor, I want to generate an impact report, so that I can share it with stakeholders.

**Acceptance Criteria**:
- [x] User can generate impact report
- [x] Select date range
- [x] Report includes: donation summary, beneficiary breakdown, impact metrics
- [x] Visual charts and graphs
- [x] Beneficiary stories (anonymized)
- [x] Download as PDF
- [x] Shareable link (optional)
- [x] Report branded with NutriGuard

**Business Rules**:
- Report formats: PDF (primary), Excel (data only)
- Report sections:
  - Executive summary
  - Donation breakdown
  - Beneficiary impact
  - Geographic distribution
  - Stories/testimonials
  - Future recommendations
- Generation time: < 10 seconds
- Retention: 90 days

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| start_date | date | Valid date | Yes |
| end_date | date | Valid date, after start_date | Yes |
| format | enum | pdf, excel | Yes |

**Error Handling**:
- No data: "No donation data for selected period"

**Dependencies**:
- FR-DM-009: View Impact Dashboard

**Related API Endpoints**:
- POST /api/donor/reports/generate
- GET /api/donor/reports/{id}/download

**Related Database Tables**:
- donations
- beneficiary_impact
- impact_reports

---

#### FR-AR-003: Beneficiary Profile

**Priority**: High  
**Status**: Draft

**Description**:
Beneficiaries can view their profile including FIES score, voucher balance, and nutrition monitoring data.

**User Story**:
As a beneficiary, I want to see my profile, so that I can understand my status and progress.

**Acceptance Criteria**:
- [x] Profile dashboard shows key information
- [x] Shows: FIES score, food insecurity level, voucher balance
- [x] Shows: children summary (if any), growth alerts
- [x] Shows: survey history, voucher transactions
- [x] Shows: nutrition recommendations
- [x] Visual indicators for status
- [x] Quick actions: shop, complete survey, track growth

**Business Rules**:
- Data: real-time updates
- FIES score: latest completed survey
- Voucher balance: available amount
- Children: count, growth alerts
- Recommendations: top 3 priorities

**Input Validation**:
No validation (read-only)

**Dependencies**:
- FR-VS-001: View Voucher Balance
- FR-FS-004: Determine Food Insecurity Level
- FR-NM-006: Alert for Abnormal Growth

**Related API Endpoints**:
- GET /api/beneficiary/profile
- GET /api/beneficiary/summary

**Related Database Tables**:
- beneficiaries
- fies_scores
- children
- vouchers

---

#### FR-AR-004: Vendor Revenue Stats

**Priority**: High  
**Status**: Draft

**Description**:
Vendors can view their revenue statistics including sales, top products, and performance metrics.

**User Story**:
As a vendor, I want to see my revenue stats, so that I can track my business performance.

**Acceptance Criteria**:
- [x] Dashboard shows revenue metrics
- [x] Metrics: total sales, commission deducted, net revenue
- [x] Charts: sales trend over time
- [x] Top selling products
- [x] Order volume by day/week
- [x] Settlement summary
- [x] Time filters: last 7 days, 30 days, 90 days, all time
- [x] Export revenue data

**Business Rules**:
- Real-time updates
- Sales: total redeemed voucher amounts
- Commission: 5% deducted
- Net revenue: sales - commission
- Top products: by quantity and revenue
- Time filters: customizable

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| time_range | enum | 7d, 30d, 90d, all | No |

**Dependencies**:
- FR-VS-003: View Settlement History

**Related API Endpoints**:
- GET /api/vendor/dashboard/stats
- GET /api/vendor/dashboard/revenue

**Related Database Tables**:
- vendor_settlements
- order_items
- voucher_transactions

---

#### FR-AR-005: Admin KPI Dashboard

**Priority**: High  
**Status**: Draft

**Description**:
Admins can view comprehensive KPI dashboard showing platform-wide statistics and performance metrics.

**User Story**:
As an admin, I want to see platform KPIs, so that I can monitor overall performance.

**Acceptance Criteria**:
- [x] Dashboard shows platform-wide KPIs
- [x] Metrics: active users, vouchers distributed, redemptions, settlement requests
- [x] User breakdown by role
- [x] Donation trends
- [x] Vendor performance metrics
- [x] Beneficiary engagement metrics
- [x] System health indicators
- [x] Time filters: real-time, daily, weekly, monthly
- [x] Alerts for anomalies

**Business Rules**:
- Data: real-time or hourly updates
- KPIs:
  - Users: total, active today, active this week
  - Vouchers: allocated, redeemed, expired
  - Donations: total, amount, success rate
  - Vendors: total, active, settlements pending
  - Beneficiaries: total, active, FIES distribution
- Alerts: unusual activity, system issues

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| time_range | enum | realtime, daily, weekly, monthly | No |

**Dependencies**:
- All modules

**Related API Endpoints**:
- GET /api/admin/dashboard/kpis
- GET /api/admin/dashboard/health

**Related Database Tables**:
- users
- vouchers
- donations
- vendor_settlements

---

#### FR-AR-006: Government National Overview

**Priority**: High  
**Status**: Draft

**Description**:
Government officials can view national-level food security statistics and program performance.

**User Story**:
As a government official, I want to see national overview, so that I can understand country-wide food security.

**Acceptance Criteria**:
- [x] Dashboard shows national statistics
- [x] Metrics: total beneficiaries, FIES score distribution, voucher distribution
- [x] Geographic heatmaps (province level)
- [x] Trend analysis over time
- [x] Program performance metrics
- [x] Demographic breakdown (age, gender, household size)
- [x] Export national data

**Business Rules**:
- Data: daily updated
- Geographic level: province (can drill down to district)
- FIES distribution: percentage by level
- Data aggregation: anonymized (no personal info)
- Export formats: PDF, Excel

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| start_date | date | Valid date | No |
| end_date | date | Valid date, after start_date | No |

**Dependencies**:
- FR-FS-005: View Survey History
- FR-VS-001: View Voucher Balance

**Related API Endpoints**:
- GET /api/government/overview/national
- GET /api/government/fies/distribution

**Related Database Tables**:
- beneficiaries
- fies_scores
- vouchers
- provinces

---

#### FR-AR-007: Government Provincial Data

**Priority**: High  
**Status**: Draft

**Description**:
Government officials can drill down to view provincial-level food security data and program effectiveness.

**User Story**:
As a government official, I want to see provincial data, so that I can identify regions needing support.

**Acceptance Criteria**:
- [x] Select province from dropdown or map
- [x] View province-specific statistics
- [x] Metrics: beneficiary count, FIES distribution, voucher usage
- [x] District-level breakdown
- [x] Program performance by district
- [x] Trend analysis over time
- [x] Comparison with national averages
- [x] Export provincial data

**Business Rules**:
- Data: daily updated
- Geographic level: province → district
- Metrics: same as national but filtered by location
- Comparison: province vs national average
- Export: PDF, Excel

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| province_id | string | Valid province ID | Yes |
| start_date | date | Valid date | No |
| end_date | date | Valid date, after start_date | No |

**Dependencies**:
- FR-AR-006: Government National Overview

**Related API Endpoints**:
- GET /api/government/overview/province
- GET /api/government/overview/district

**Related Database Tables**:
- beneficiaries
- fies_scores
- vouchers
- provinces
- districts

---

#### FR-AR-008: Download Reports (PDF/Excel)

**Priority**: Medium  
**Status**: Draft

**Description**:
Users can download various reports in PDF or Excel format for offline use.

**User Story**:
As a user, I want to download reports, so that I can use them offline or share with others.

**Acceptance Criteria**:
- [x] Select report type
- [x] Select date range
- [x] Select format (PDF, Excel)
- [x] Generate report
- [x] Download file
- [x] Report includes: summary, detailed data
- [x] Branded with NutriGuard
- [x] Download link expires after 24 hours

**Business Rules**:
- Report types: donation, settlement, beneficiary, impact, system
- Formats: PDF (presentations), Excel (data analysis)
- Generation time: < 30 seconds
- File size: < 10MB (Excel), < 5MB (PDF)
- Retention: 90 days

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| report_type | enum | donation, settlement, beneficiary, impact, system | Yes |
| format | enum | pdf, excel | Yes |
| start_date | date | Valid date | Yes |
| end_date | date | Valid date, after start_date | Yes |

**Error Handling**:
- No data: "No data available for selected period"
- Invalid format: "Invalid report format"

**Dependencies**:
- All analytics modules

**Related API Endpoints**:
- POST /api/reports/generate
- GET /api/reports/{id}/download

**Related Database Tables**:
- report_files
- (various depending on report type)

---

## 3.11 Notifications

This module covers in-app notifications, email notifications, and notification management.

---

#### FR-NT-001: List Notifications

**Priority**: Medium  
**Status**: Draft

**Description**:
Users can view their notification history including read/unread status.

**User Story**:
As a user, I want to see my notifications, so that I can stay updated on important activities.

**Acceptance Criteria**:
- [x] User can view notification list
- [x] Shows: notification type, message, timestamp, read status
- [x] Filter by: all, unread, important
- [x] Sort by: date (newest first)
- [x] Pagination (20 items per page)
- [x] Mark notification as read on click
- [x] Notification count badge on icon
- [x] Real-time updates (new notifications appear immediately)

**Business Rules**:
- Notification types: info, warning, success, error
- Read status: tracked
- Real-time: via Supabase Realtime
- Retention: 90 days, then archived

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| status | enum | all, unread, important | No |
| page | number | Positive integer | No |

**Dependencies**:
- None

**Related API Endpoints**:
- GET /api/notifications
- GET /api/notifications/unread-count

**Related Database Tables**:
- notifications

---

#### FR-NT-002: Mark as Read

**Priority**: Medium  
**Status**: Draft

**Description**:
Users can mark notifications as read individually or in bulk.

**User Story**:
As a user, I want to mark notifications as read, so that I can clear my notification list.

**Acceptance Criteria**:
- [x] User can mark single notification as read
- [x] User can mark all as read
- [x] Mark as read updates notification status
- [x] Notification count badge updates
- [x] Mark action: instant

**Business Rules**:
- Mark as read: status = "read"
- Read timestamp: recorded
- Bulk mark: all unread notifications
- No undo (can mark as unread via API if needed)

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| notification_id | UUID | Valid notification ID (single) | No |
| mark_all | boolean | Mark all unread as read | No |

**Dependencies**:
- FR-NT-001: List Notifications

**Related API Endpoints**:
- PUT /api/notifications/{id}/read
- PUT /api/notifications/read-all

**Related Database Tables**:
- notifications

---

#### FR-NT-003: Send Notifications (Admin)

**Priority**: Medium  
**Status**: Draft

**Description**:
Admins can send bulk notifications to users based on various criteria.

**User Story**:
As an admin, I want to send notifications, so that I can communicate important updates to users.

**Acceptance Criteria**:
- [x] Admin can compose notification
- [x] Select target audience (all users, by role, specific users)
- [x] Select notification type (info, warning, success)
- [x] Enter notification message
- [x] Schedule notification (send now or at specific time)
- [x] Preview notification before sending
- [x] Send notification (creates in-app + email)
- [x] Track delivery status
- [x] Notification history maintained

**Business Rules**:
- Target audiences: all, donors, beneficiaries, vendors, admins, government, custom
- Notification types: info, warning, success
- Scheduling: send immediately or scheduled
- Delivery: in-app + email
- Delivery tracking: pending, sent, failed
- Broadcast: max 1 per day to avoid spam

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| target | enum | all, donor, beneficiary, vendor, admin, government, custom | Yes |
| user_ids | array | Valid user UUIDs (if custom) | Conditional |
| type | enum | info, warning, success | Yes |
| message | string | Min 10 chars, max 500 chars | Yes |
| scheduled_at | datetime | Future date/time (optional) | No |

**Error Handling**:
- No recipients: "No recipients selected"
- Daily limit reached: "Maximum 1 broadcast per day"

**Dependencies**:
- FR-NT-001: List Notifications

**Related API Endpoints**:
- POST /api/admin/notifications/send
- GET /api/admin/notifications/history

**Related Database Tables**:
- notifications
- notification_broadcasts

---

#### FR-NT-004: Email Notifications

**Priority**: Medium  
**Status**: Draft

**Description**:
System sends email notifications for various events (donation confirmations, voucher allocations, survey reminders, etc.).

**User Story**:
As a user, I want to receive email notifications, so that I can stay informed even when offline.

**Acceptance Criteria**:
- [x] Email sent for important events
- [x] Email types: registration, verification, donation, voucher, survey, settlement, alerts
- [x] Emails are branded with NutriGuard
- [x] Emails contain clear call-to-action
- [x] Email preferences customizable (unsubscribe)
- [x] Delivery tracking (success, bounce, opened)
- [x] Retry failed emails (3 attempts)

**Business Rules**:
- Email service: SendGrid
- Email branding: NutriGuard logo, colors
- Events:
  - Registration: Welcome email
  - Verification: Email verification link
  - Donation: Confirmation and receipt
  - Voucher allocation: Notification
  - Survey: Monthly reminder
  - Settlement: Confirmation
  - Alerts: Growth alerts, expiration reminders
- Unsubscribe: per event type or all
- Retries: 3 attempts over 24 hours

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| event_type | enum | registration, verification, donation, voucher, survey, settlement, alert | Yes |
| user_id | UUID | Valid user ID | Yes |

**Dependencies**:
- All modules (various events trigger emails)

**Related API Endpoints**:
- POST /api/notifications/email/send
- POST /api/users/{id}/email-preferences

**Related Database Tables**:
- email_notifications
- email_preferences

---

#### FR-NT-005: Push Notifications (Optional)

**Priority**: Low  
**Status**: Draft

**Description**:
System sends push notifications to mobile devices for real-time updates (future enhancement).

**User Story**:
As a user, I want to receive push notifications, so that I can stay updated on my mobile device.

**Acceptance Criteria**:
- [x] User can enable push notifications
- [x] User can select notification types
- [x] Push notifications sent for important events
- [x] Notifications show on device (with sound/vibration)
- [x] Clicking notification opens app
- [x] Notification badge count
- [x] Clear notifications from device

**Business Rules**:
- Push service: Firebase Cloud Messaging (FCM) or OneSignal
- Notification types: same as email (configurable)
- Device registration: token stored per user
- Opt-in: user must enable
- Delivery tracking: sent, delivered, opened, clicked

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| device_token | string | Valid device token | Yes |
| notification_types | array | Valid event types | Yes |

**Dependencies**:
- FR-NT-004: Email Notifications (same event types)

**Related API Endpoints**:
- POST /api/notifications/register-device
- PUT /api/users/{id}/push-preferences

**Related Database Tables**:
- push_notifications
- device_tokens
- notification_preferences

---

## 3.12 Admin Operations

This module covers admin-specific operations including user management, approvals, and system configuration.

---

#### FR-AO-001: List All Users

**Priority**: High  
**Status**: Draft

**Description**:
Admins can view a list of all users with filtering and search capabilities.

**User Story**:
As an admin, I want to list all users, so that I can manage user accounts.

**Acceptance Criteria**:
- [x] Admin can view all users
- [x] Each user shows: email, name, role, status, created date
- [x] Filter by role
- [x] Filter by status (active, inactive, verified, unverified)
- [x] Search by email, name, phone
- [x] Sort by various fields
- [x] Pagination (20 items per page)
- [x] Export user list

**Business Rules**:
- User list: all registered users
- Roles: donor, corporate_donor, beneficiary, vendor, admin, government
- Status: active, inactive, verified
- Search: searches email, name, phone
- Export: CSV, Excel

**Input Validation**:
| Parameter | Type | Validation | Required |
|-----------|------|------------|----------|
| role | enum | donor, corporate_donor, beneficiary, vendor, admin, government | No |
| status | enum | active, inactive, verified | No |
| search | string | Min 2 chars | No |
| page | number | Positive integer | No |

**Dependencies**:
- FR-AM-005: Profile Management

**Related API Endpoints**:
- GET /api/admin/users
- GET /api/admin/users/export

**Related Database Tables**:
- users
- user_profiles
- user_roles

---

#### FR-AO-002: Verify User Role

**Priority**: High  
**Status**: Draft

**Description**:
Admins verify user roles that require verification (beneficiary, vendor, government, admin).

**User Story**:
As an admin, I want to verify user roles, so that only legitimate users have access to certain features.

**Acceptance Criteria**:
- [x] Admin can view pending role verification requests
- [x] View user profile and uploaded documents
- [x] Approve or reject role verification
- [x] Provide rejection reason
- [x] Verification status updated
- [x] User notified of verification result
- [x] Audit trail maintained

**Business Rules**:
- Roles requiring verification: beneficiary, vendor, government, admin
- Verification: review documents (KTP, KK, business license)
- Verification results: approved, rejected
- Rejection reasons: incomplete docs, invalid info, fraud
- Audit: who verified, when, decision, reason

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| user_role_id | UUID | Valid user role ID | Yes |
| action | enum | approve, reject | Yes |
| rejection_reason | text | Min 10 chars (if reject) | Conditional |

**Error Handling**:
- Role not found: "User role not found"
- Already verified: "This role has already been verified"

**Dependencies**:
- FR-AM-008: Role Verification

**Related API Endpoints**:
- GET /api/admin/verifications/pending
- POST /api/admin/verifications/{id}/approve
- POST /api/admin/verifications/{id}/reject

**Related Database Tables**:
- user_roles (verified, verified_at, verified_by)
- verification_logs

---

#### FR-AO-003: Approve Vendor

**Priority**: High  
**Status**: Draft

**Description**:
Admins approve vendor applications after reviewing business documents and information.

**User Story**:
As an admin, I want to approve vendors, so that they can start selling on the platform.

**Acceptance Criteria**:
- [x] Admin can view pending vendor applications
- [x] View vendor business information
- [x] Review uploaded documents (business license, etc.)
- [x] Approve or reject vendor
- [x] Provide rejection reason
- [x] Vendor status updated
- [x] Vendor notified of approval/rejection
- [x] Approved vendors can add products

**Business Rules**:
- Vendor status: pending, approved, rejected, suspended
- Required documents: business license, tax ID, bank account
- Review checks: document validity, business registration, location
- Approval: vendor becomes active
- Rejection: vendor can resubmit after fixing issues

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| vendor_id | UUID | Valid vendor ID | Yes |
| action | enum | approve, reject | Yes |
| rejection_reason | text | Min 10 chars (if reject) | Conditional |

**Error Handling**:
- Vendor not found: "Vendor not found"
- Already processed: "Vendor application has already been processed"

**Dependencies**:
- FR-PC-007: Vendor Add Product

**Related API Endpoints**:
- GET /api/admin/vendors/pending
- POST /api/admin/vendors/{id}/approve
- POST /api/admin/vendors/{id}/reject

**Related Database Tables**:
- vendors (status, approved_at, approved_by, rejected_at, rejected_reason)
- vendor_documents

---

#### FR-AO-004: Approve Product

**Priority**: High  
**Status**: Draft

**Description**:
Admins review and approve product submissions from vendors before they become visible in the catalog.

**User Story**:
As an admin, I want to approve products, so that only legitimate products are available.

**Acceptance Criteria**:
- [x] Admin can view pending product submissions
- [x] View complete product details
- [x] View vendor information
- [x] Review product images and nutrition info
- [x] Approve or reject product
- [x] Provide rejection reason
- [x] Product status updated
- [x] Vendor notified of approval/rejection
- [x] Approved products visible in catalog

**Business Rules**:
- Product status: pending_approval, approved, rejected
- Review criteria: valid category, complete nutrition info, appropriate pricing, quality images
- Approval: product becomes visible
- Rejection: vendor can edit and resubmit
- Batch approval available

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| product_ids | array | Valid product UUIDs | Yes |
| action | enum | approve, reject | Yes |
| rejection_reason | text | Min 10 chars (if reject) | Conditional |

**Dependencies**:
- FR-PC-010: Admin Approve Product

**Related API Endpoints**:
- GET /api/admin/products/pending
- POST /api/admin/products/approve
- POST /api/admin/products/reject

**Related Database Tables**:
- products (status, approved_at, approved_by)
- product_reviews

---

#### FR-AO-005: Batch Voucher Allocation

**Priority**: High  
**Status**: Draft

**Description**:
Admins can batch allocate vouchers to multiple beneficiaries at once.

**User Story**:
As an admin, I want to batch allocate vouchers, so that I can efficiently distribute donations.

**Acceptance Criteria**:
- [x] Admin can select donation pool
- [x] Select target beneficiaries (auto or manual)
- [x] Set voucher amount per beneficiary
- [x] Review allocation summary
- [x] Execute batch allocation
- [x] Vouchers created and assigned
- [x] Beneficiaries notified
- [x] Allocation logged

**Business Rules**:
- Allocation strategies: auto (based on FIES priority), manual (select specific beneficiaries)
- Voucher amount: min Rp 100.000, max Rp 1.000.000
- Auto allocation: prioritize severe food insecurity (FIES 6-8)
- Batch size: 10-50 beneficiaries
- Allocation tracked for audit

**Input Validation**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| donation_id | UUID | Valid donation ID | Yes |
| allocation_strategy | enum | auto, manual | Yes |
| beneficiary_ids | array | Valid beneficiary UUIDs (if manual) | Conditional |
| amount_per_beneficiary | number | Min 100.000, max 1.000.000 | Yes |

**Error Handling**:
- Insufficient donation: "Donation amount insufficient"
- No eligible beneficiaries: "No eligible beneficiaries found"
- Daily limit: "Daily allocation limit reached"

**Dependencies**:
- FR-DM-010: Allocate Vouchers to Beneficiaries

**Related API Endpoints**:
- POST /api/admin/vouchers/batch-allocate
- GET /api/admin/vouchers/allocation-status

**Related Database Tables**:
- vouchers
- voucher_allocations
- beneficiaries

---

#### FR-AO-006: Detect Anomalies (Fraud)

**Priority**: Medium  
**Status**: Draft

**Description**:
System detects and alerts admins to anomalous activities that may indicate fraud or abuse.

**User Story**:
As an admin, I want to see fraud alerts, so that I can protect the platform.

**Acceptance Criteria**:
- [x] System detects anomalous activities
- [x] Alerts shown in admin dashboard
- [x] Alert types: unusual redemption patterns, duplicate accounts, suspicious transactions
- [x] Each alert shows: date, user, activity description, severity
- [x] Alerts prioritized by severity
- [x] Admin can investigate alerts
- [x] Alert history maintained
- [x] Customizable alert rules

**Business Rules**:
- Anomaly detection types:
  - Unusual redemption: excessive frequency, unusual amounts
  - Duplicate accounts: similar email, phone, IP
  - Suspicious transactions: rapid consecutive orders
  - FIES manipulation: inconsistent responses over time
- Severity levels: low, medium, high, critical
- Auto-blocking: critical alerts may auto-suspend account
- Investigation: admin review required

**Input Validation**:
No validation (automatic)

**Dependencies**:
- All modules (various activities trigger detection)

**Related API Endpoints**:
- GET /api/admin/anomalies
- GET /api/admin/anomalies/{id}/investigate
- POST /api/admin/users/{id}/suspend

**Related Database Tables**:
- fraud_alerts
- anomaly_logs

---

#### FR-AO-007: System Configuration

**Priority**: Medium  
**Status**: Draft

**Description**:
Admins can configure system settings including settlement rules, commission rates, and platform parameters.

**User Story**:
As an admin, I want to configure system settings, so that I can adjust platform behavior.

**Acceptance Criteria**:
- [x] Admin can access system configuration
- [x] Settings categories: settlement, commission, vouchers, notifications
- [x] Edit settings with validation
- [x] Preview changes before applying
- [x] Changes logged for audit
- [x] Configuration history maintained
- [x] Rollback to previous configuration

**Business Rules**:
- Configurable settings:
  - Settlement: minimum days (3-14), minimum amount (Rp 500.000 - 2.000.000)
  - Commission: vendor rate (5%), other rates
  - Vouchers: expiration period (30 days), minimum/maximum allocation amounts
  - Notifications: daily limits, types
- Changes logged with: who, when, what changed
- Rollback: can revert to any previous configuration (30 days)
- System restart: some changes may require system restart

**Input Validation**:
| Setting | Type | Validation | Required |
|---------|------|------------|----------|
| settlement_min_days | number | 3-14 | No |
| settlement_min_amount | number | 500.000 - 2.000.000 | No |
| vendor_commission_rate | number | 0-100 (%) | No |
| voucher_expiration_days | number | 1-90 | No |

**Error Handling**:
- Invalid setting: "Invalid configuration value"
- Out of range: "Value must be between X and Y"

**Dependencies**:
- All modules (configuration affects various features)

**Related API Endpoints**:
- GET /api/admin/config
- PUT /api/admin/config
- POST /api/admin/config/rollback

**Related Database Tables**:
- system_config
- config_history

---

## 4. Non-Functional Requirements

Non-functional requirements are documented in a separate document: [Non-Functional Requirements](/03-NON-FUNCTIONAL-REQUIREMENTS.md)

**Key Non-Functional Requirements:**
- Performance: API response time < 500ms
- Security: Encryption, RLS, GDPR compliance
- Scalability: Support 100,000+ users
- Reliability: 99.9% uptime
- Usability: Mobile-responsive, WCAG 2.1 AA

---

## 5. Constraints & Assumptions

### 5.1 Technical Constraints

- **Backend**: Must use Supabase (PostgreSQL, Auth, Storage)
- **Frontend**: Must use React 18 + TypeScript + Vite
- **Payment**: Must use Indonesian payment gateway (Midtrans/Xendit)
- **Mobile**: Responsive web app (no native mobile app in MVP)

### 5.2 Business Constraints

- **Geographic**: Initial focus on Indonesia
- **Currency**: Indonesian Rupiah (IDR)
- **Language**: Bahasa Indonesia (primary), English (secondary)
- **Voucher Validity**: 1 month max
- **Minimum Donation**: Rp 100.000

### 5.3 Regulatory Constraints

- **Data Protection**: Must comply with Indonesian PDP Law 2022
- **Financial**: Must comply with Bank Indonesia payment regulations
- **Health**: Must follow Health Ministry nutrition guidelines
- **Tax**: Must provide tax receipts with NPWP

### 5.4 Assumptions

- **Internet Access**: Users have internet access (mobile or broadband)
- **Smartphone**: Beneficiaries have smartphone or access to device
- **Vendor Network**: Sufficient vendor coverage in target areas
- **Payment Gateway**: Midtrans/Xendit integration available
- **Email Delivery**: Email service (SendGrid) is reliable
- **Donor Base**: Sufficient donor interest to sustain operations

---

## 6. Dependencies

### 6.1 Internal Dependencies

| Module | Depends On | Description |
|--------|------------|-------------|
| Donation Management | Authentication | User must be authenticated to donate |
| Voucher System | Donation Management | Vouchers are created from donations |
| Product Catalog | Vendor Management | Vendors add products to catalog |
| Orders | Voucher System | Orders use vouchers |
| FIES Survey | Authentication | Beneficiary must be authenticated |

### 6.2 External Dependencies

| Service | Purpose | Criticality |
|---------|---------|-------------|
| Supabase | Backend as a Service | Critical |
| Midtrans/Xendit | Payment processing | Critical |
| SendGrid | Email service | High |
| AWS S3/GCS | Document storage | Medium |

### 6.3 Third-Party Integrations

- **Payment Gateway**: Midtrans (or Xendit)
- **Email Service**: SendGrid
- **Cloud Storage**: Supabase Storage (based on AWS S3)
- **Analytics**: Google Analytics (future)

---

## 7. Appendix

### 7.1 Glossary

| Term | Definition |
|------|------------|
| **E-Voucher** | Electronic voucher for purchasing nutrition products |
| **FIES** | Food Insecurity Experience Scale (8-question survey) |
| **WHO** | World Health Organization |
| **RLS** | Row-Level Security |
| **JWT** | JSON Web Token |
| **CSR** | Corporate Social Responsibility |
| **Z-Score** | Standard score for child growth assessment |
| **HAZ** | Height-for-Age Z-Score |
| **WAZ** | Weight-for-Age Z-Score |
| **WHZ** | Weight-for-Height Z-Score |
| **NPWP** | Nomor Pokok Wajib Pajak (Indonesian Tax ID) |

### 7.2 Reference Documents

- [Project Overview](/00-PROJECT-OVERVIEW.md) - Business context and features
- [System Architecture](/01-SYSTEM-ARCHITECTURE.md) - Technical implementation
- [Non-Functional Requirements](/03-NON-FUNCTIONAL-REQUIREMENTS.md) - Performance, security, scalability
- [Database Design](/04-DATABASE-DESIGN.md) - Database schema and relationships
- [API Requirements](/05-API-REQUIREMENTS.md) - API endpoint specifications
- [Testing Strategy](/06-TESTING-STRATEGY.md) - Quality assurance approach
- [Deployment Guide](/07-DEPLOYMENT-GUIDE.md) - Production deployment

### 7.3 Change History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-03-05 | Initial document creation - Modules 1-3 | Product Team |

---

**End of Document**
