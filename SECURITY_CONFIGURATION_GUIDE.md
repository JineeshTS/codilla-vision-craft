# Security Configuration Guide

## ⚠️ Manual Security Configuration Required

This guide covers security settings that **cannot be automated** via SQL migrations and require manual configuration in the Supabase Dashboard.

---

## 🔐 Leaked Password Protection

### Status
❌ **Currently Disabled** - Requires immediate attention

### Risk Level
**HIGH** - Users can set passwords that appear in known data breaches

### Impact
- Account takeover risk from reused passwords
- Users vulnerable to credential stuffing attacks
- Compliance issues for data protection

### How to Enable (5 minutes)

1. **Access Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   - Navigate to: **Authentication → Providers → Email**

2. **Locate Password Security Section**
   - Scroll down to **"Password Security"**
   - You'll see options for password requirements

3. **Enable Leaked Password Protection**
   - ✅ Check **"Check for leaked passwords"**
   - This uses the HaveIBeenPwned API to check against 500M+ leaked passwords

4. **Configure Password Strength (Recommended)**
   ```
   Minimum password length: 12
   ✅ Require uppercase letters
   ✅ Require lowercase letters  
   ✅ Require numbers
   ✅ Require special characters
   ```

5. **Save Changes**
   - Click **"Save"** at the bottom of the page
   - Changes apply immediately to new signups
   - Existing users will need to update passwords on next login (optional enforcement)

### Verification

After enabling, test with a known leaked password:
- Try signing up with: `password123` or `qwerty123`
- Should receive error: "This password has been found in a data breach"

---

## 🛡️ Additional Security Recommendations

### 1. Two-Factor Authentication (Future Enhancement)

**Status**: Not yet implemented
**Recommended**: Enable for admin users at minimum

**How to Enable**:
- Supabase supports TOTP (Time-based One-Time Password)
- See: https://supabase.com/docs/guides/auth/auth-mfa

### 2. Rate Limiting

**Status**: ✅ Implemented at application level
**Current Settings**:
- AI chat: 30 messages/hour per user
- Phase validation: 20 validations/hour per user

**Dashboard Settings** (Additional Protection):
- Go to: **Authentication → Rate Limits**
- Recommended settings:
  ```
  Signup: 10 per hour per IP
  Login: 20 per hour per IP
  Email/SMS: 10 per hour per user
  ```

### 3. Email Templates

**Status**: Default templates in use
**Recommended**: Customize for brand consistency

**How to Customize**:
1. Go to: **Authentication → Email Templates**
2. Customize:
   - Confirmation email
   - Password reset email
   - Magic link email
   - Email change confirmation

### 4. JWT Expiry

**Current**: Default Supabase settings
**Recommended Review**:
- Access token expiry: 1 hour (default)
- Refresh token expiry: 60 days (default)
- Consider shorter expiry for high-security applications

**How to Configure**:
- Go to: **Authentication → Settings**
- Adjust JWT expiry times as needed

### 5. OAuth Provider Security

**Currently Enabled**: GitHub OAuth
**Security Checklist**:
- ✅ Callback URL is whitelisted
- ✅ Using environment variables for secrets
- ⚠️ Review GitHub app permissions periodically

---

## 📋 Security Checklist

### Critical (Do Now)
- [ ] Enable leaked password protection
- [ ] Configure minimum password strength
- [ ] Test with leaked password
- [ ] Document settings in team wiki

### Important (This Week)
- [ ] Review rate limiting settings
- [ ] Customize email templates
- [ ] Set up 2FA for admin accounts
- [ ] Review JWT expiry times

### Good to Have (This Month)
- [ ] Set up security monitoring/alerts
- [ ] Create security incident response plan
- [ ] Schedule quarterly security audits
- [ ] Review OAuth provider permissions

---

## 🚨 Security Incident Response

### If a User Reports Compromised Account:

1. **Immediate Actions**:
   - Revoke all user sessions via SQL:
     ```sql
     DELETE FROM auth.sessions WHERE user_id = 'USER_ID';
     ```
   - Force password reset via email
   - Check `token_transactions` for suspicious activity

2. **Investigation**:
   - Review login history (if logging enabled)
   - Check for unusual API calls
   - Verify no unauthorized data access

3. **Prevention**:
   - Enable 2FA for the user
   - Educate user on password security
   - Document incident for pattern analysis

---

## 📚 References

- [Supabase Password Security Docs](https://supabase.com/docs/guides/auth/password-security)
- [Supabase MFA Docs](https://supabase.com/docs/guides/auth/auth-mfa)
- [OWASP Password Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)

---

## 🔄 Regular Security Maintenance

### Weekly
- Review failed login attempts
- Check for unusual token usage patterns
- Monitor error logs for security exceptions

### Monthly
- Review active sessions
- Audit admin access logs
- Update security documentation

### Quarterly
- Full security audit
- Review and update RLS policies
- Test backup/recovery procedures
- Update security training materials

---

**Last Updated**: 2025-11-05
**Next Review**: 2025-12-05
**Owner**: Platform Admin Team
