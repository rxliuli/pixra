import { contextKeyService, ContextKeyService } from './ContextKeyService'

/**
 * When 子句解析器
 * 解析并求值 enablement 表达式
 *
 * 支持的语法：
 * - 布尔键: "hasActiveDocument"
 * - 否定: "!hasActiveDocument"
 * - 与: "hasActiveDocument && hasSelection"
 * - 或: "hasActiveDocument || hasSelection"
 * - 相等: "editorMode == 'select'"
 * - 不等: "editorMode != 'select'"
 * - 括号: "(a && b) || c"
 */
export class WhenClauseParser {
  private contextKeyService: ContextKeyService

  constructor(contextService?: ContextKeyService) {
    this.contextKeyService = contextService || contextKeyService
  }

  /**
   * 求值表达式
   */
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

  /**
   * 解析表达式（入口）
   */
  private parseExpression(expr: string): boolean {
    return this.parseOr(expr)
  }

  /**
   * 解析 OR 表达式
   */
  private parseOr(expr: string): boolean {
    const parts = this.splitByOperator(expr, '||')
    if (parts.length > 1) {
      return parts.some((part) => this.parseAnd(part.trim()))
    }
    return this.parseAnd(expr)
  }

  /**
   * 解析 AND 表达式
   */
  private parseAnd(expr: string): boolean {
    const parts = this.splitByOperator(expr, '&&')
    if (parts.length > 1) {
      return parts.every((part) => this.parseUnary(part.trim()))
    }
    return this.parseUnary(expr)
  }

  /**
   * 解析一元表达式（NOT 和括号）
   */
  private parseUnary(expr: string): boolean {
    expr = expr.trim()

    // 处理括号
    if (expr.startsWith('(') && expr.endsWith(')')) {
      return this.parseExpression(expr.slice(1, -1))
    }

    // 处理 NOT
    if (expr.startsWith('!')) {
      return !this.parseUnary(expr.slice(1).trim())
    }

    return this.parseComparison(expr)
  }

  /**
   * 解析比较表达式
   */
  private parseComparison(expr: string): boolean {
    // 检查不等于
    if (expr.includes('!=')) {
      const [left, right] = expr.split('!=').map((s) => s.trim())
      return this.getValue(left) !== this.parseValue(right)
    }

    // 检查相等
    if (expr.includes('==')) {
      const [left, right] = expr.split('==').map((s) => s.trim())
      return this.getValue(left) === this.parseValue(right)
    }

    // 简单布尔键
    return Boolean(this.getValue(expr))
  }

  /**
   * 按操作符分割，但忽略括号内的操作符
   */
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

  /**
   * 从上下文获取值
   */
  private getValue(key: string): unknown {
    return this.contextKeyService.get(key.trim())
  }

  /**
   * 解析字面量值
   */
  private parseValue(value: string): unknown {
    value = value.trim()

    // 字符串字面量（单引号或双引号）
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      return value.slice(1, -1)
    }

    // 布尔值
    if (value === 'true') return true
    if (value === 'false') return false

    // 数字
    const num = Number(value)
    if (!isNaN(num)) return num

    // 否则视为上下文键
    return this.getValue(value)
  }
}

// 导出单例
export const whenClauseParser = new WhenClauseParser()
