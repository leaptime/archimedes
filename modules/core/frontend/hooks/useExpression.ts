import { useMemo, useCallback } from 'react';
import { ExpressionContext } from '../views/types';

/**
 * Safely evaluate a JavaScript expression in a sandboxed context
 */
function evaluateExpression(
    expr: string | boolean | undefined,
    context: ExpressionContext
): boolean {
    // Handle non-string values
    if (typeof expr === 'boolean') return expr;
    if (expr === undefined || expr === null) return false;
    if (expr === '') return false;
    if (expr === 'true' || expr === '1') return true;
    if (expr === 'false' || expr === '0') return false;

    // Create safe context with only allowed variables
    const safeContext = {
        record: context.record || {},
        parent: context.parent || {},
        user: context.user || { id: 0, name: '', groups: [] },
        env: context.env || { isMobile: false, lang: 'en' },
    };

    try {
        // Use Function constructor for sandboxed eval
        const fn = new Function(
            'record',
            'parent', 
            'user',
            'env',
            `"use strict"; return (${expr});`
        );
        return Boolean(fn(
            safeContext.record,
            safeContext.parent,
            safeContext.user,
            safeContext.env
        ));
    } catch (e) {
        console.warn(`Expression evaluation failed: "${expr}"`, e);
        return false;
    }
}

/**
 * Hook to evaluate dynamic expressions
 */
export function useExpression(
    expr: string | boolean | undefined,
    context: ExpressionContext
): boolean {
    return useMemo(
        () => evaluateExpression(expr, context),
        [expr, context.record, context.parent, context.user, context.env]
    );
}

/**
 * Hook to create an expression evaluator function
 */
export function useExpressionEvaluator(context: ExpressionContext) {
    return useCallback(
        (expr: string | boolean | undefined) => evaluateExpression(expr, context),
        [context.record, context.parent, context.user, context.env]
    );
}

/**
 * Evaluate multiple expressions at once
 */
export function useExpressions(
    expressions: Record<string, string | boolean | undefined>,
    context: ExpressionContext
): Record<string, boolean> {
    return useMemo(() => {
        const results: Record<string, boolean> = {};
        for (const [key, expr] of Object.entries(expressions)) {
            results[key] = evaluateExpression(expr, context);
        }
        return results;
    }, [expressions, context.record, context.parent, context.user, context.env]);
}

export { evaluateExpression };
