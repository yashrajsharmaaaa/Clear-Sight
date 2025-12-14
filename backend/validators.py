"""
Input validation for ClearSight API endpoints.
Enforces strict type checking and sanitization to prevent injection attacks.
"""

import re
from typing import Optional, Tuple


class ValidationError(Exception):
    """Raised when input validation fails"""
    pass


def validate_name(name: Optional[str]) -> str:
    """
    Validate and sanitize user name.
    
    Args:
        name: User's full name
        
    Returns:
        str: Sanitized name
        
    Raises:
        ValidationError: If name is invalid
    """
    if not name or not isinstance(name, str):
        raise ValidationError("Name is required and must be a string")
    
    name = name.strip()
    
    if len(name) < 2:
        raise ValidationError("Name must be at least 2 characters long")
    
    if len(name) > 100:
        raise ValidationError("Name must not exceed 100 characters")
    
    # Allow letters, spaces, hyphens, apostrophes, and common international characters
    if not re.match(r"^[\w\s\-'\.]+$", name, re.UNICODE):
        raise ValidationError("Name contains invalid characters")
    
    return name


def validate_email(email: Optional[str]) -> Optional[str]:
    """
    Validate and sanitize email address.
    
    Args:
        email: Email address (optional)
        
    Returns:
        Optional[str]: Sanitized email or None
        
    Raises:
        ValidationError: If email format is invalid
    """
    if not email:
        return None
    
    if not isinstance(email, str):
        raise ValidationError("Email must be a string")
    
    email = email.strip().lower()
    
    if len(email) > 100:
        raise ValidationError("Email must not exceed 100 characters")
    
    # RFC 5322 simplified email validation
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        raise ValidationError("Invalid email format")
    
    return email


def validate_employee_id(employee_id: Optional[str]) -> str:
    """
    Validate and sanitize employee ID.
    
    Args:
        employee_id: Employee identifier
        
    Returns:
        str: Sanitized employee ID
        
    Raises:
        ValidationError: If employee ID is invalid
    """
    if not employee_id or not isinstance(employee_id, str):
        raise ValidationError("Employee ID is required and must be a string")
    
    employee_id = employee_id.strip()
    
    if len(employee_id) < 1:
        raise ValidationError("Employee ID cannot be empty")
    
    if len(employee_id) > 50:
        raise ValidationError("Employee ID must not exceed 50 characters")
    
    # Allow alphanumeric, hyphens, underscores
    if not re.match(r'^[a-zA-Z0-9\-_]+$', employee_id):
        raise ValidationError("Employee ID can only contain letters, numbers, hyphens, and underscores")
    
    return employee_id


def validate_department(department: Optional[str]) -> str:
    """
    Validate and sanitize department name.
    
    Args:
        department: Department name
        
    Returns:
        str: Sanitized department name
        
    Raises:
        ValidationError: If department is invalid
    """
    if not department or not isinstance(department, str):
        raise ValidationError("Department is required and must be a string")
    
    department = department.strip()
    
    if len(department) < 2:
        raise ValidationError("Department must be at least 2 characters long")
    
    if len(department) > 100:
        raise ValidationError("Department must not exceed 100 characters")
    
    # Allow letters, spaces, hyphens, ampersands
    if not re.match(r'^[\w\s\-&]+$', department, re.UNICODE):
        raise ValidationError("Department contains invalid characters")
    
    return department


def validate_age(age: Optional[str]) -> int:
    """
    Validate and convert age to integer.
    
    Args:
        age: Age as string or int
        
    Returns:
        int: Validated age
        
    Raises:
        ValidationError: If age is invalid
    """
    if not age:
        raise ValidationError("Age is required")
    
    try:
        age_int = int(age)
    except (ValueError, TypeError):
        raise ValidationError("Age must be a valid number")
    
    if age_int < 18:
        raise ValidationError("Age must be at least 18")
    
    if age_int > 120:
        raise ValidationError("Age must not exceed 120")
    
    return age_int


def validate_gender(gender: Optional[str]) -> str:
    """
    Validate gender selection.
    
    Args:
        gender: Gender identifier
        
    Returns:
        str: Validated gender
        
    Raises:
        ValidationError: If gender is invalid
    """
    if not gender or not isinstance(gender, str):
        raise ValidationError("Gender is required and must be a string")
    
    gender = gender.strip()
    
    valid_genders = {'Male', 'Female', 'Other'}
    if gender not in valid_genders:
        raise ValidationError(f"Gender must be one of: {', '.join(valid_genders)}")
    
    return gender


def validate_user_id(user_id: any) -> int:
    """
    Validate user ID for database queries.
    
    Args:
        user_id: User identifier
        
    Returns:
        int: Validated user ID
        
    Raises:
        ValidationError: If user ID is invalid
    """
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise ValidationError("User ID must be a valid integer")
    
    if user_id_int < 1:
        raise ValidationError("User ID must be a positive integer")
    
    return user_id_int


def validate_limit(limit: any, max_limit: int = 1000) -> int:
    """
    Validate pagination limit parameter.
    
    Args:
        limit: Limit value
        max_limit: Maximum allowed limit
        
    Returns:
        int: Validated limit
        
    Raises:
        ValidationError: If limit is invalid
    """
    try:
        limit_int = int(limit)
    except (ValueError, TypeError):
        raise ValidationError("Limit must be a valid integer")
    
    if limit_int < 1:
        raise ValidationError("Limit must be at least 1")
    
    if limit_int > max_limit:
        raise ValidationError(f"Limit must not exceed {max_limit}")
    
    return limit_int


def validate_registration_data(data: dict) -> Tuple[str, Optional[str], str, str, int, str]:
    """
    Validate all registration data at once.
    
    Args:
        data: Dictionary containing registration fields
        
    Returns:
        Tuple: (name, email, employee_id, department, age, gender)
        
    Raises:
        ValidationError: If any field is invalid
    """
    name = validate_name(data.get('name'))
    email = validate_email(data.get('email'))
    employee_id = validate_employee_id(data.get('employee_id'))
    department = validate_department(data.get('department'))
    age = validate_age(data.get('age'))
    gender = validate_gender(data.get('gender'))
    
    return name, email, employee_id, department, age, gender
