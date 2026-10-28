# User Account Creation Module --- Implementation Guide

## 1. Purpose

This document describes **only the user account creation and
business-profile module** for the Retail Product Description Generator.
It covers retailer registration, validation, database storage, login,
and profile management. Product-description generation and CSV batch
processing are outside this module's scope.

## 2. Registration Form Requirements

The registration page should collect the following information:

  -----------------------------------------------------------------------
  Field                   Required?               Validation / Notes
  ----------------------- ----------------------- -----------------------
  Full name               Yes                     Must not be blank

  Email address           Yes                     Valid email format;
                                                  unique account
                                                  identifier

  Phone number            Yes                     Validate reasonable
                                                  phone-number format

  Company / organization  No                      For a registered
  name                                            company or organization

  Shop / business name    Yes                     Must not be blank

  Business type           Yes                     Select from the
                                                  supported business
                                                  categories

  GSTIN                   No                      Optional; check format
                                                  only unless connected
                                                  to an official
                                                  verification service

  Address line            No                      Street/building details

  City                    No                      City or town

  State                   No                      State or union
                                                  territory

  PIN code                No                      Validate Indian
                                                  PIN-code format when
                                                  supplied

  Password                Yes                     Minimum 8 characters;
                                                  stronger password rules
                                                  are recommended

  Confirm password        Yes                     Must match the password
  -----------------------------------------------------------------------

Suggested business-type options: - Retail shop - Grocery / supermarket -
Clothing / fashion - Electronics - Pharmacy - Home / furniture - Beauty
/ personal care - Wholesale / distributor - Online store - Other

**Important:** GSTIN should remain optional because not every shop is
GST-registered. A format check does not prove that a GSTIN is active or
belongs to the registrant.

## 3. Technology Stack

-   **Frontend:** React with Vite
-   **Backend:** Python with FastAPI
-   **Database:** SQLite for the prototype; PostgreSQL is a suitable
    production option
-   **ORM:** SQLAlchemy
-   **Validation:** Pydantic
-   **Password hashing:** Argon2 via `pwdlib`
-   **Authentication:** JWT access token via `PyJWT`
-   **Configuration:** Environment variables loaded from `.env`

## 4. Account-Creation Workflow

``` mermaid
flowchart TD
    A[Retailer opens registration page] --> B[Enters personal and shop details]
    B --> C[Frontend validates required fields]
    C -->|Invalid| D[Show validation errors]
    D --> B
    C -->|Valid| E[Send registration request to FastAPI]
    E --> F[Backend validates fields]
    F --> G{Email already registered?}
    G -->|Yes| H[Return conflict error]
    G -->|No| I[Hash password with Argon2]
    I --> J[Save user and business details in database]
    J --> K[Return success response]
    K --> L[Show confirmation and direct user to login]
```

## 5. Database Design

A `users` table can store both login information and the retailer's
business profile for the initial prototype.

  Column           Suggested type            Purpose
  ---------------- ------------------------- ---------------------------------------------
  id               Integer, primary key      Internal user identifier
  full_name        String                    Retailer's name
  email            String, unique, indexed   Login email
  phone            String                    Contact number
  organization     String, nullable          Company / organization
  shop_name        String                    Retail shop or business name
  business_type    String                    Selected business category
  gst_number       String, nullable          GSTIN, if supplied
  address_line     String, nullable          Address
  city             String, nullable          City
  state            String, nullable          State
  pincode          String, nullable          PIN code
  password_hash    String                    Hashed password only; never store plaintext
  preferred_tone   String, nullable          Optional profile preference
  created_at       DateTime                  Account creation timestamp

Use a unique constraint on email. Consider normalizing phone numbers and
adding a unique phone constraint only if the product's account policy
requires one.

## 6. API Endpoints

  Method   Endpoint           Purpose
  -------- ------------------ -------------------------------------------
  POST     `/auth/register`   Validate and create a retailer account
  POST     `/auth/login`      Authenticate using email and password
  GET      `/auth/me`         Return the signed-in user's profile
  PATCH    `/auth/me`         Update permitted profile and shop details

### Example registration request

``` json
{
  "full_name": "Asha Kumar",
  "email": "asha@example.com",
  "phone": "+919876543210",
  "organization": "Asha Retail Pvt Ltd",
  "shop_name": "Asha Fashion Store",
  "business_type": "Clothing / fashion",
  "gst_number": "",
  "address_line": "12 Market Road",
  "city": "Bengaluru",
  "state": "Karnataka",
  "pincode": "560001",
  "password": "ReplaceWithAStrongPassword123",
  "confirm_password": "ReplaceWithAStrongPassword123"
}
```

This is sample data for development only. Do not use a real person's
personal details or a real password in test fixtures.

### Registration backend logic

1.  Validate the request with Pydantic....
2.  Normalize the email (trim whitespace and lowercase it).
3.  Confirm that the password and confirmation match.
4.  Check whether the email is already registered.
5.  Validate optional fields such as GSTIN and PIN code when provided.
6.  Hash the password using Argon2.
7.  Store the user and business details in a database transaction.
8.  Return a safe response that excludes `password` and `password_hash`.

Recommended status codes: - `201 Created` --- account created
successfully - `400 Bad Request` --- invalid input or mismatched
passwords - `409 Conflict` --- email already registered -
`422 Unprocessable Entity` --- request validation failed

## 7. Login and Session Handling

1.  The retailer submits email and password.
2.  The backend looks up the account by normalized email.
3.  Verify the submitted password against the stored Argon2 hash.
4.  If valid, issue a short-lived signed JWT access token.
5.  Require that token for protected profile endpoints.
6.  Never return the password hash in API responses or logs.

For a learning prototype, the frontend may keep the token in memory or
browser storage. For production, prefer a carefully configured
`HttpOnly`, `Secure`, `SameSite` cookie approach where appropriate,
along with CSRF protections and a clear session-expiry strategy.

## 8. Frontend Pages and Components

-   `AuthScreen` --- switches between registration and login.
-   `RegisterForm` --- captures personal and shop information.
-   `LoginForm` --- email and password.
-   `ProfilePage` --- displays and edits account and business details.
-   `FormField` --- reusable label, input, and validation message.
-   `BusinessTypeSelect` --- dropdown of supported business types.

Frontend validation improves usability, but **the backend must validate
every field again**.

## 9. Environment Configuration

Create a backend `.env` file based on `.env.example`. Use a long, random
secret for `JWT_SECRET`; do not commit `.env` to Git.

Example configuration:

``` env
DATABASE_URL=sqlite:///./retail_generator.db
JWT_SECRET=replace_with_a_long_random_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Use a different secret in each environment. If the JWT secret is
exposed, rotate it.

## 10. Security and Privacy Checklist

-   [ ] Hash passwords with Argon2; never store plaintext passwords.
-   [ ] Keep secrets in environment variables, not source code.
-   [ ] Use HTTPS in deployment.
-   [ ] Enforce unique email addresses in the database.
-   [ ] Return only safe user fields from registration and profile APIs.
-   [ ] Rate-limit registration and login endpoints.
-   [ ] Avoid revealing whether an email exists in contexts where
    account enumeration is a concern.
-   [ ] Add email verification before treating an email address as
    verified.
-   [ ] Add SMS OTP only if phone-number verification is required;
    collecting a phone number alone does not verify it.
-   [ ] Do not claim that GSTIN is verified unless an official
    verification service has actually confirmed it.
-   [ ] Provide a privacy notice explaining why contact and business
    details are collected.
-   [ ] Restrict profile updates to allowlisted fields and the
    authenticated user's own account.

## 11. Testing Checklist

-   [ ] Register with valid required fields.
-   [ ] Reject a malformed email address.
-   [ ] Reject a missing phone or shop name.
-   [ ] Reject passwords shorter than the configured minimum.
-   [ ] Reject mismatched password confirmation.
-   [ ] Reject a duplicate email.
-   [ ] Confirm the database contains a password hash, not the original
    password.
-   [ ] Confirm API responses never expose password fields.
-   [ ] Log in with the correct password.
-   [ ] Reject an incorrect password.
-   [ ] Reject profile requests without valid authentication.
-   [ ] Update a profile and confirm changes persist.
-   [ ] Test optional GSTIN, address, and PIN-code fields.
-   [ ] Test migration against an existing development database before
    distributing an update.

## 12. Scope and Future Enhancements

**Included in this module:** retailer registration, validation, account
persistence, email/password login, authenticated profile access, and
editing business details.

**Not included unless implemented separately:** email verification,
phone OTP, password reset, social login, official GSTIN lookup,
administrator approval, multi-user teams per shop, and production
deployment.

## 13. Definition of Done

The module is ready for prototype demonstration when a retailer can
create an account with required details, duplicate email addresses are
rejected, passwords are securely hashed, login works, authenticated
users can view and update their own business profile, and tests confirm
that private fields are not exposed.
