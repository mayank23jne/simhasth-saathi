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
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				
				/* Brand Colors */
				saffron: {
					DEFAULT: 'hsl(var(--saffron))',
					light: 'hsl(var(--saffron-light))',
					dark: 'hsl(var(--saffron-dark))'
				},
				'sky-blue': {
					DEFAULT: 'hsl(var(--sky-blue))',
					light: 'hsl(var(--sky-blue-light))',
					dark: 'hsl(var(--sky-blue-dark))'
				},
				
				/* Status Colors */
				safe: 'hsl(var(--safe-green))',
				warning: {
					DEFAULT: 'hsl(var(--warning-orange))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				danger: 'hsl(var(--danger-red))',
				
				/* Component Colors */
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted-background))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
					border: 'hsl(var(--card-border))'
				}
			},
			spacing: {
				'touch': 'var(--touch-target)',
				'button': 'var(--button-height)',
				'nav': 'var(--nav-height)',
				'xs': 'var(--space-xs)',
				'sm': 'var(--space-sm)',
				'md': 'var(--space-md)',
				'lg': 'var(--space-lg)',
				'xl': 'var(--space-xl)',
				'2xl': 'var(--space-2xl)',
				'pb-nav': '80px'
			},
			borderRadius: {
				'xl': 'var(--radius-xl)',
				'lg': 'var(--radius-large)',
				DEFAULT: 'var(--radius)',
				'md': 'calc(var(--radius) - 2px)',
				'sm': 'calc(var(--radius) - 4px)'
			},
			minHeight: {
				'touch': 'var(--touch-target)',
				'button': 'var(--button-height)'
			},
			boxShadow: {
				soft: 'var(--shadow-soft)',
				medium: 'var(--shadow-medium)',
				strong: 'var(--shadow-strong)'
			},
			fontSize: {
				'xl-mobile': ['1.375rem', { lineHeight: '1.5', letterSpacing: '-0.02em' }],
				'2xl-mobile': ['1.75rem', { lineHeight: '1.4', letterSpacing: '-0.02em' }],
				'3xl-mobile': ['2.25rem', { lineHeight: '1.3', letterSpacing: '-0.03em' }]
			},
			fontFamily: {
				'devanagari': ['Noto Sans Devanagari', 'sans-serif'],
				'system': ['system-ui', '-apple-system', 'sans-serif']
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
