# ClearSight Deployment Checklist

This checklist guides you through deploying the ClearSight face recognition application with MySQL database support. Follow each step in order to ensure a successful deployment.

## Pre-Deployment Preparation

### 1. Code Preparation
- [ ] All code changes committed to Git repository
- [ ] All tests passing locally
- [ ] Requirements.txt includes `mysql-connector-python>=8.0.0`
- [ ] Database abstraction layer supports MySQL
- [ ] Environment-based configuration implemented

### 2. Database Planning
- [ ] Decide on database provider (Render MySQL, AWS RDS, Google Cloud SQL, etc.)
- [ ] Determine database size requirements
- [ ] Plan for backup strategy
- [ ] Review security requirements

### 3. Data Migration (if applicable)
- [ ] Backup existing SQLite database
- [ ] Test migration script with sample data
- [ ] Verify face features data integrity after migration
- [ ] Document any migration issues encountered
- [ ] Keep SQLite backup for rollback capability

## Database Setup

### 4. Create MySQL Database

#### For Render MySQL:
- [ ] Log in to Render dashboard
- [ ] Create new MySQL database
- [ ] Select appropriate region and instance type
- [ ] Note down connection credentials
- [ ] Save Internal Database URL for web service connection

#### For AWS RDS:
- [ ] Create RDS MySQL instance
- [ ] Configure security groups to allow connections
- [ ] Enable automated backups
- [ ] Note down endpoint and credentials

#### For Google Cloud SQL:
- [ ] Create Cloud SQL MySQL instance
- [ ] Configure authorized networks
- [ ] Enable automatic backups
- [ ] Note down connection details

#### For Other Providers:
- [ ] Follow provider-specific setup instructions
- [ ] Ensure MySQL version 8.0 or higher
- [ ] Configure firewall rules for access
- [ ] Obtain connection credentials

### 5. Initialize Database Schema
- [ ] Connect to MySQL database using credentials
- [ ] Verify connection successful
- [ ] Run schema initialization (automatic on first app startup)
- [ ] Verify tables created: `users`, `recognition_logs`
- [ ] Verify indexes created on key columns
- [ ] Verify foreign key constraints established

### 6. Migrate Data (if applicable)
- [ ] Run migration script: `python migrate_sqlite_to_mysql.py`
- [ ] Verify user count matches source database
- [ ] Verify recognition log count matches source database
- [ ] Spot-check sample records for data integrity
- [ ] Verify face features JSON data is valid
- [ ] Test face recognition with migrated data

## Application Deployment

### 7. Configure Environment Variables

#### Required Variables:
- [ ] `DATABASE_TYPE=mysql`
- [ ] `MYSQL_HOST` (database hostname)
- [ ] `MYSQL_PORT` (typically 3306)
- [ ] `MYSQL_DATABASE` (database name)
- [ ] `MYSQL_USER` (database username)
- [ ] `MYSQL_PASSWORD` (database password)
- [ ] `SECRET_KEY` (Flask secret key)
- [ ] `CORS_ORIGINS` (frontend URL)

#### Optional Variables:
- [ ] `MYSQL_POOL_SIZE` (default: 5)
- [ ] `MYSQL_POOL_RECYCLE` (default: 3600)

### 8. Deploy Backend Service

#### For Render:
- [ ] Create new Web Service or update existing
- [ ] Connect to Git repository
- [ ] Set build command: `pip install --upgrade pip setuptools && pip install -r backend/requirements.txt`
- [ ] Set start command: `python backend/app.py`
- [ ] Configure environment variables from step 7
- [ ] Enable auto-deploy (optional)
- [ ] Trigger manual deploy

#### For Other Platforms:
- [ ] Follow platform-specific deployment instructions
- [ ] Ensure Python 3.9+ runtime
- [ ] Configure environment variables
- [ ] Deploy application code

### 9. Deploy Frontend Service

#### For Vercel:
- [ ] Connect to Git repository
- [ ] Configure build settings for React app
- [ ] Set environment variable: `REACT_APP_API_URL` (backend URL)
- [ ] Deploy frontend
- [ ] Note frontend URL for CORS configuration

#### For Other Platforms:
- [ ] Follow platform-specific deployment instructions
- [ ] Configure API endpoint URL
- [ ] Deploy frontend code

## Post-Deployment Verification

### 10. Verify Database Connection
- [ ] Check application logs for "Database initialized successfully"
- [ ] Verify no connection errors in logs
- [ ] Test database connection from application
- [ ] Monitor connection pool usage

### 11. Verify API Endpoints

#### Health Check:
- [ ] Access backend URL in browser
- [ ] Verify service is running

#### User Registration:
- [ ] Navigate to registration page
- [ ] Upload a test face image
- [ ] Fill in user details
- [ ] Submit registration
- [ ] Verify success message
- [ ] Check database for new user record

#### Face Recognition:
- [ ] Navigate to recognition page
- [ ] Upload or capture face image
- [ ] Verify recognition result
- [ ] Check confidence score
- [ ] Verify recognition log created in database

#### Dashboard:
- [ ] Navigate to dashboard
- [ ] Verify user list displays correctly
- [ ] Verify recognition logs display correctly
- [ ] Check that timestamps are accurate
- [ ] Verify user details are complete

### 12. Verify Data Integrity
- [ ] Spot-check user records in database
- [ ] Verify face features are stored correctly (JSON format)
- [ ] Verify recognition logs link to correct users
- [ ] Check foreign key relationships
- [ ] Verify timestamps are in correct timezone

### 13. Performance Testing
- [ ] Test response times for API endpoints
- [ ] Monitor database query performance
- [ ] Check connection pool metrics
- [ ] Test with multiple concurrent users (if possible)
- [ ] Verify no connection pool exhaustion

### 14. Security Verification
- [ ] Verify database credentials not exposed in logs
- [ ] Confirm SSL/TLS enabled for database connections
- [ ] Test CORS configuration with frontend
- [ ] Verify no SQL injection vulnerabilities
- [ ] Check that sensitive data is properly protected

## Monitoring Setup

### 15. Configure Monitoring
- [ ] Set up application logging
- [ ] Configure database monitoring
- [ ] Set up error alerting
- [ ] Monitor connection pool usage
- [ ] Track API response times
- [ ] Monitor database storage usage

### 16. Set Up Backups
- [ ] Verify automated database backups enabled
- [ ] Test backup restoration process
- [ ] Document backup retention policy
- [ ] Schedule regular backup verification

## Documentation

### 17. Update Documentation
- [ ] Document deployment configuration
- [ ] Record environment variable values (excluding passwords)
- [ ] Document any deployment issues and solutions
- [ ] Update README with deployment URLs
- [ ] Create runbook for common operations

### 18. Team Communication
- [ ] Notify team of deployment completion
- [ ] Share access credentials securely
- [ ] Document any known issues
- [ ] Schedule post-deployment review

## Rollback Plan

### 19. Prepare Rollback Procedure
- [ ] Document previous deployment configuration
- [ ] Keep SQLite backup accessible
- [ ] Document rollback steps
- [ ] Test rollback procedure (if possible)
- [ ] Identify rollback decision criteria

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: "Can't connect to MySQL server"
**Symptoms:** Application fails to start, connection errors in logs

**Solutions:**
1. Verify MYSQL_HOST is correct (use internal hostname for Render)
2. Check MYSQL_PORT is set to 3306
3. Verify database server is running
4. Check firewall rules allow connections
5. Verify network connectivity between app and database

#### Issue: "Access denied for user"
**Symptoms:** Authentication errors in logs

**Solutions:**
1. Double-check MYSQL_USER and MYSQL_PASSWORD
2. Verify user exists in database
3. Check user has proper permissions (SELECT, INSERT, UPDATE, DELETE, CREATE)
4. Verify password doesn't contain special characters that need escaping

#### Issue: "Table doesn't exist"
**Symptoms:** SQL errors when accessing endpoints

**Solutions:**
1. Check logs for schema initialization errors
2. Verify database user has CREATE TABLE permission
3. Manually connect to database and verify tables exist
4. Re-run schema initialization if needed

#### Issue: "Too many connections"
**Symptoms:** Connection pool exhaustion, timeout errors

**Solutions:**
1. Increase MYSQL_POOL_SIZE environment variable
2. Check for connection leaks in code
3. Monitor active connections in database
4. Consider upgrading database instance

#### Issue: "Slow query performance"
**Symptoms:** High response times, timeout errors

**Solutions:**
1. Verify indexes are created on key columns
2. Check database instance resources (CPU, memory)
3. Review slow query logs
4. Consider upgrading database instance
5. Optimize queries if needed

#### Issue: "Face recognition not working after migration"
**Symptoms:** Recognition fails, low confidence scores

**Solutions:**
1. Verify face_features data migrated correctly
2. Check JSON format is valid in MySQL TEXT column
3. Verify face feature vector dimensions (should be 128 or 512)
4. Test with newly registered users
5. Compare face features before and after migration

#### Issue: "CORS errors in frontend"
**Symptoms:** API requests blocked by browser

**Solutions:**
1. Verify CORS_ORIGINS includes frontend URL
2. Check frontend URL matches exactly (including https://)
3. Verify no trailing slashes in URLs
4. Check backend CORS configuration
5. Test with browser developer tools

## Post-Deployment Tasks

### 20. Optimization
- [ ] Review and optimize database queries
- [ ] Adjust connection pool size based on usage
- [ ] Implement caching if needed
- [ ] Optimize image upload/storage
- [ ] Review and optimize API response times

### 21. Maintenance Planning
- [ ] Schedule regular database maintenance
- [ ] Plan for database growth and scaling
- [ ] Set up automated monitoring alerts
- [ ] Document maintenance procedures
- [ ] Schedule regular security updates

## Sign-Off

### Deployment Completed By:
- **Name:** ___________________________
- **Date:** ___________________________
- **Deployment Environment:** ___________________________

### Verified By:
- **Name:** ___________________________
- **Date:** ___________________________

### Notes:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

---

## Quick Reference

### Essential Commands

**Check database connection:**
```bash
mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE
```

**View tables:**
```sql
SHOW TABLES;
```

**Check user count:**
```sql
SELECT COUNT(*) FROM users;
```

**Check recognition log count:**
```sql
SELECT COUNT(*) FROM recognition_logs;
```

**View recent recognition logs:**
```sql
SELECT rl.*, u.name 
FROM recognition_logs rl 
JOIN users u ON rl.user_id = u.id 
ORDER BY rl.timestamp DESC 
LIMIT 10;
```

### Important URLs

- **Backend API:** ___________________________
- **Frontend App:** ___________________________
- **Database Dashboard:** ___________________________
- **Monitoring Dashboard:** ___________________________

### Emergency Contacts

- **Database Admin:** ___________________________
- **DevOps Lead:** ___________________________
- **On-Call Engineer:** ___________________________
