import { contextKeyService, ContextKeyService } from './ContextKeyService'

/**
 * When Clause Parser
 * Parses and evaluates enablement expressions
 *
 * Supported syntax:
 * - Boolean key: "hasActiveTab"
 * - Negation: "!hasActiveTab"
 * - And: "hasActiveTab && hasSelection"
 * - Or: "hasActiveTab || hasSelection"
 * - Equality: "editorMode == 'select'"
 * - Inequality: "editorMode != 'select'"
 * - Parentheses: "(a && b) || c"
 */
export class WhenClauseParser {
  private contextKeyService: ContextKeyService

  constructor(contextService?: ContextKeyService) {
    this.contextKeyService = contextService || contextKeyService
  }

  evaluate(expression: string): boolean {
    if (!expression || expression.trim() === '') {
      return true
    }

    try {
      return this.parseExpression(expression.trim())
    } catch (error) {
      console.error(`Failed to evaluate when clause: ${expression}`, error)
      return false
    }
  }

  private parseExpression(expr: string): boolean {
    return this.parseOr(expr)
  }

  private parseOr(expr: string): boolean {
    const parts = this.splitByOperator(expr, '||')
    if (parts.length > 1) {
      return parts.some((part) => this.parseAnd(part.trim()))
    }
    return this.parseAnd(expr)
  }

  private parseAnd(expr: string): boolean {
    const parts = this.splitByOperator(expr, '&&')
    if (parts.length > 1) {
      return parts.every((part) => this.parseUnary(part.trim()))
    }
    return this.parseUnary(expr)
  }

  private parseUnary(expr: string): boolean {
    expr = expr.trim()

    if (expr.startsWith('(') && expr.endsWith(')')) {
      return this.parseExpression(expr.slice(1, -1))
    }

    if (expr.startsWith('!')) {
      return !this.parseUnary(expr.slice(1).trim())
    }

    return this.parseComparison(expr)
  }

  private parseComparison(expr: string): boolean {
    if (expr.includes('!=')) {
      const [left, right] = expr.split('!=').map((s) => s.trim())
      return this.getValue(left) !== this.parseValue(right)
    }

    if (expr.includes('==')) {
      const [left, right] = expr.split('==').map((s) => s.trim())
      return this.getValue(left) === this.parseValue(right)
    }

    return Boolean(this.getValue(expr))
  }

  private splitByOperator(expr: string, operator: string): string[] {
    const parts: string[] = []
    let current = ''
    let depth = 0

    for (let i = 0; i < expr.length; i++) {
      const char = expr[i]

      if (char === '(') {
        depth++
        current += char
      } else if (char === ')') {
        depth--
        current += char
      } else if (
        depth === 0 &&
        expr.slice(i, i + operator.length) === operator
      ) {
        parts.push(current)
        current = ''
        i += operator.length - 1
      } else {
        current += char
      }
    }

    if (current) {
      parts.push(current)
    }

    return parts
  }

  private getValue(key: string): unknown {
    return this.contextKeyService.get(key.trim())
  }

  private parseValue(value: string): unknown {
    value = value.trim()

    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      return value.slice(1, -1)
    }

    if (value === 'true') return true
    if (value === 'false') return false

    const num = Number(value)
    if (!isNaN(num)) return num

    return this.getValue(value)
  }
}

export const whenClauseParser = new WhenClauseParser()
