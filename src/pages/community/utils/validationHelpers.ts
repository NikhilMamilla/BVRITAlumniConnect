// validationHelpers.ts
// Advanced, Firestore-compliant validation helpers for the community platform

import { REGEX, ERROR_MESSAGES } from './constants';
import type {
  ValidationRule,
  ValidationConstraint,
  ValidationType,
  ValidationCondition,
  ValidationResult,
  ValidationError,
} from '../types/common.types';

// Validate a single field value against its constraints
export function validateField(
  value: unknown,
  constraints: ValidationConstraint[],
  allValues?: Record<string, unknown>
): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const rule of constraints) {
    if (rule.when && !evaluateCondition(rule.when, allValues)) continue;
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          errors.push({ field: '', message: rule.message, code: 'required' });
        }
        break;
      case 'min_length':
        if (typeof value === 'string' && value.length < (rule.value as number)) {
          errors.push({ field: '', message: rule.message, code: 'min_length' });
        }
        break;
      case 'max_length':
        if (typeof value === 'string' && value.length > (rule.value as number)) {
          errors.push({ field: '', message: rule.message, code: 'max_length' });
        }
        break;
      case 'pattern':
        if (typeof value === 'string' && rule.value instanceof RegExp && !rule.value.test(value)) {
          errors.push({ field: '', message: rule.message, code: 'pattern' });
        }
        break;
      case 'email':
        if (typeof value === 'string' && !REGEX.EMAIL.test(value)) {
          errors.push({ field: '', message: rule.message, code: 'email' });
        }
        break;
      case 'url':
        if (typeof value === 'string' && !REGEX.URL.test(value)) {
          errors.push({ field: '', message: rule.message, code: 'url' });
        }
        break;
      case 'numeric':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push({ field: '', message: rule.message, code: 'numeric' });
        }
        break;
      case 'file_size':
        if (typeof value === 'number' && rule.value && value > (rule.value as number)) {
          errors.push({ field: '', message: rule.message, code: 'file_size' });
        }
        break;
      case 'file_type':
        if (typeof value === 'string' && rule.value && Array.isArray(rule.value) && !rule.value.includes(value)) {
          errors.push({ field: '', message: rule.message, code: 'file_type' });
        }
        break;
      case 'custom':
        if (typeof rule.value === 'function' && !(rule.value as (v: unknown) => boolean)(value)) {
          errors.push({ field: '', message: rule.message, code: 'custom' });
        }
        break;
      default:
        break;
    }
  }
  return errors;
}

// Validate an object against a set of validation rules
export function validateObject(
  values: Record<string, unknown>,
  rules: ValidationRule[]
): ValidationResult {
  const errors: ValidationError[] = [];
  for (const rule of rules) {
    const fieldErrors = validateField(values[rule.field], rule.rules, values).map(e => ({ ...e, field: rule.field }));
    errors.push(...fieldErrors);
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Evaluate a validation condition (for conditional rules)
function evaluateCondition(condition: ValidationCondition, values?: Record<string, unknown>): boolean {
  if (!values) return false;
  const fieldValue = values[condition.field];
  switch (condition.operator) {
    case '==': return fieldValue === condition.value;
    case '!=': return fieldValue !== condition.value;
    case '>': return typeof fieldValue === 'number' && fieldValue > (condition.value as number);
    case '<': return typeof fieldValue === 'number' && fieldValue < (condition.value as number);
    default: return false;
  }
}

// Validate with regex utility
export function validateWithRegex(value: string, regex: RegExp): boolean {
  return regex.test(value);
}

// Get standardized validation result
export function getValidationResult(errors: ValidationError[]): ValidationResult {
  return {
    isValid: errors.length === 0,
    errors,
  };
} 