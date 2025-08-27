import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				// AlgoVisuals Color System
				'primary-blue': 'hsl(var(--primary-blue))',
				'primary-purple': 'hsl(var(--primary-purple))',
				'primary-teal': 'hsl(var(--primary-teal))',
				'accent-cyan': 'hsl(var(--accent-cyan))',
				'accent-pink': 'hsl(var(--accent-pink))',
				
				// Base Colors
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				
				// Glass System
				'glass-bg': 'var(--glass-bg)',
				'glass-border': 'var(--glass-border)',
				'hover-glass': 'var(--hover-glass)',
				'active-glass': 'var(--active-glass)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
