
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
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					light: 'hsl(175, 75%, 55%)',
					dark: 'hsl(175, 75%, 35%)'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				turquoise: {
					100: 'hsl(175, 75%, 85%)',
					200: 'hsl(175, 75%, 75%)',
					300: 'hsl(175, 75%, 65%)',
					400: 'hsl(175, 75%, 55%)',
					500: 'hsl(175, 75%, 45%)',
					600: 'hsl(175, 75%, 35%)',
					700: 'hsl(175, 75%, 25%)',
					800: 'hsl(175, 75%, 15%)',
					900: 'hsl(175, 75%, 10%)'
				},
				darkgray: {
					100: 'hsl(220, 10%, 40%)',
					200: 'hsl(220, 10%, 35%)',
					300: 'hsl(220, 10%, 30%)',
					400: 'hsl(220, 10%, 25%)',
					500: 'hsl(220, 10%, 20%)',
					600: 'hsl(220, 10%, 15%)',
					700: 'hsl(220, 10%, 12%)',
					800: 'hsl(220, 10%, 10%)',
					900: 'hsl(220, 10%, 8%)'
				}
			},
			fontFamily: {
				sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
				mono: ['Fira Code', 'Consolas', 'monospace'],
			},
			fontSize: {
				'2xs': '0.625rem', // 10px
			},
			spacing: {
				'4.5': '1.125rem', // 18px
				'18': '4.5rem',    // 72px
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
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				'fade-out': {
					'0%': { opacity: '1' },
					'100%': { opacity: '0' },
				},
				'slide-in': {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-out': 'fade-out 0.3s ease-out',
				'slide-in': 'slide-in 0.3s ease-out'
			},
			boxShadow: {
				'soft': '0 4px 10px rgba(0, 0, 0, 0.15)',
				'medium': '0 8px 30px rgba(0, 0, 0, 0.18)',
				'hard': '0 15px 50px rgba(0, 0, 0, 0.25)',
				'glow': '0 0 15px rgba(42, 204, 190, 0.5)',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
