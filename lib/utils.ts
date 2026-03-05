import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility para combinar clases de Tailwind CSS con fusión inteligente
 * 
 * Utiliza `clsx` para condicionalmente incluir clases y `twMerge`
 * para resolver conflictos entre clases de Tailwind (ej: si aplicas
 * dos tamaños different, inteligentemente elige uno).
 * 
 * @example
 * cn('px-2', 'px-4')  // Resultado: 'px-4'
 * cn('px-2', condition && 'py-2')  // Resultado condicionado
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

