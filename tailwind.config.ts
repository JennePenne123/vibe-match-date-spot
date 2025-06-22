
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
				// vyybmtch expressive color palette
				vyy: {
					coral: '#FF6B9D',
					sunset: '#FFB347',
					peach: '#FF8A80',
					lavender: '#B39DDB',
					mint: '#81C784',
					sky: '#64B5F6',
					warm: '#FFCCBC',
					soft: '#F8BBD9',
					glow: '#FFE0B2'
				}
			},
			backgroundImage: {
				// Expressive gradients
				'vyy-primary': 'linear-gradient(135deg, #FF6B9D 0%, #FFB347 100%)',
				'vyy-secondary': 'linear-gradient(135deg, #B39DDB 0%, #81C784 100%)',
				'vyy-sunset': 'linear-gradient(135deg, #FFB347 0%, #FF8A80 100%)',
				'vyy-dreamy': 'linear-gradient(135deg, #F8BBD9 0%, #FFE0B2 100%)',
				'vyy-organic': 'linear-gradient(145deg, #FF6B9D 0%, #FFB347 50%, #FF8A80 100%)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'organic': '2rem 3rem 2.5rem 2rem',
				'organic-sm': '1rem 1.5rem 1.25rem 1rem'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 20px rgba(255, 107, 157, 0.3)' },
					'50%': { boxShadow: '0 0 40px rgba(255, 107, 157, 0.6)' }
				},
				'organic-morph': {
					'0%, 100%': { borderRadius: '2rem 3rem 2.5rem 2rem' },
					'50%': { borderRadius: '3rem 2rem 3rem 2.5rem' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'organic-morph': 'organic-morph 4s ease-in-out infinite'
			},
			fontFamily: {
				sans: ['Inter', 'ui-sans-serif', 'system-ui'],
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
