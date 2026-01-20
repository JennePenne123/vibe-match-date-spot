
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
    		padding: '2.5rem',
    		screens: {
    			'2xl': '1400px'
    		}
    	},
    	fontFamily: {
    		sans: [
    			'Inter',
    			'ui-sans-serif',
    			'system-ui',
    			'-apple-system',
    			'BlinkMacSystemFont',
    			'Segoe UI',
    			'Roboto',
    			'Helvetica Neue',
    			'Arial',
    			'Noto Sans',
    			'sans-serif'
    		],
    		display: [
    			'Inter',
    			'ui-sans-serif',
    			'system-ui'
    		],
    		serif: [
    			'Inter',
    			'ui-serif',
    			'Georgia',
    			'Cambria',
    			'Times New Roman',
    			'Times',
    			'serif'
    		],
    		mono: [
    			'SF Mono',
    			'ui-monospace',
    			'SFMono-Regular',
    			'Menlo',
    			'Monaco',
    			'Consolas',
    			'Liberation Mono',
    			'Courier New',
    			'monospace'
    		]
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
    			// Wellness earth tone palette
    			sage: {
    				'50': 'hsl(150, 30%, 97%)',
    				'100': 'hsl(150, 28%, 92%)',
    				'200': 'hsl(150, 26%, 85%)',
    				'300': 'hsl(150, 25%, 72%)',
    				'400': 'hsl(150, 24%, 58%)',
    				'500': 'hsl(150, 25%, 45%)',
    				'600': 'hsl(150, 28%, 38%)',
    				'700': 'hsl(150, 30%, 32%)',
    				'800': 'hsl(150, 32%, 26%)',
    				'900': 'hsl(150, 35%, 20%)'
    			},
    			sand: {
    				'50': 'hsl(35, 40%, 97%)',
    				'100': 'hsl(35, 35%, 92%)',
    				'200': 'hsl(35, 30%, 85%)',
    				'300': 'hsl(35, 28%, 75%)',
    				'400': 'hsl(35, 25%, 62%)',
    				'500': 'hsl(35, 22%, 50%)',
    				'600': 'hsl(35, 25%, 42%)',
    				'700': 'hsl(35, 28%, 35%)',
    				'800': 'hsl(35, 30%, 28%)',
    				'900': 'hsl(35, 32%, 22%)'
    			},
    			terracotta: {
    				'50': 'hsl(25, 45%, 97%)',
    				'100': 'hsl(25, 40%, 92%)',
    				'200': 'hsl(25, 38%, 82%)',
    				'300': 'hsl(25, 36%, 70%)',
    				'400': 'hsl(25, 35%, 60%)',
    				'500': 'hsl(25, 35%, 55%)',
    				'600': 'hsl(25, 38%, 48%)',
    				'700': 'hsl(25, 40%, 40%)',
    				'800': 'hsl(25, 42%, 32%)',
    				'900': 'hsl(25, 45%, 25%)'
    			},
    			success: {
    				'50': 'hsl(145, 45%, 97%)',
    				'500': 'hsl(145, 40%, 42%)',
    				'600': 'hsl(145, 42%, 38%)'
    			},
    			warning: {
    				'50': 'hsl(40, 80%, 97%)',
    				'500': 'hsl(40, 70%, 50%)',
    				'600': 'hsl(40, 72%, 45%)'
    			},
    			error: {
    				'50': 'hsl(0, 60%, 97%)',
    				'500': 'hsl(0, 50%, 55%)',
    				'600': 'hsl(0, 52%, 50%)'
    			}
    		},
    		backgroundImage: {
    			'gradient-primary': 'var(--gradient-primary)',
    			'gradient-secondary': 'var(--gradient-secondary)',
    			'gradient-accent': 'var(--gradient-accent)',
    			'gradient-calm': 'var(--gradient-calm)',
    			'gradient-earth': 'var(--gradient-earth)',
    			'gradient-meadow': 'var(--gradient-meadow)',
    			'gradient-sunrise': 'var(--gradient-sunrise)',
    			// Legacy mappings
    			'gradient-romantic': 'var(--gradient-calm)',
    			'gradient-dreamy': 'var(--gradient-sunrise)',
    			'gradient-surface-light': 'var(--gradient-surface-subtle)',
    			'gradient-surface-dark': 'var(--gradient-surface-warm)',
    			'gradient-glass-light': 'var(--gradient-surface-glass)',
    			'gradient-glass-dark': 'var(--gradient-surface-glass)'
    		},
    		boxShadow: {
    			'gentle-sm': 'var(--shadow-gentle-sm)',
    			'gentle-md': 'var(--shadow-gentle-md)',
    			'gentle-lg': 'var(--shadow-gentle-lg)',
    			'gentle-xl': 'var(--shadow-gentle-xl)',
    			'focus': 'var(--shadow-focus)',
    			'elevated': 'var(--shadow-elevated)',
    			// Legacy mappings
    			'premium-sm': 'var(--shadow-gentle-sm)',
    			'premium-md': 'var(--shadow-gentle-md)',
    			'premium-lg': 'var(--shadow-gentle-lg)',
    			'premium-xl': 'var(--shadow-gentle-xl)',
    			'glow-sm': 'var(--shadow-focus)',
    			'glow-md': 'var(--shadow-glow)',
    			'glow-lg': 'var(--shadow-glow)',
    			'glass': 'var(--shadow-glass)',
    			'glass-strong': 'var(--shadow-elevated)',
    			'2xs': 'var(--shadow-2xs)',
    			'xs': 'var(--shadow-xs)',
    			'sm': 'var(--shadow-sm)',
    			'md': 'var(--shadow-md)',
    			'lg': 'var(--shadow-lg)',
    			'xl': 'var(--shadow-xl)',
    			'2xl': 'var(--shadow-2xl)'
    		},
    		backdropBlur: {
    			'glass': '16px',
    			'glass-strong': '24px'
    		},
    		borderRadius: {
    			'lg': 'var(--radius)',
    			'md': 'calc(var(--radius) - 4px)',
    			'sm': 'calc(var(--radius) - 8px)',
    			'xl': 'calc(var(--radius) + 4px)',
    			'2xl': 'calc(var(--radius) + 8px)',
    			'3xl': 'calc(var(--radius) + 16px)'
    		},
    		spacing: {
    			'18': '4.5rem',
    			'22': '5.5rem'
    		},
    		transitionDuration: {
    			'400': '400ms',
    			'600': '600ms'
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
    				'0%': {
    					opacity: '0',
    					transform: 'translateY(8px)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translateY(0)'
    				}
    			},
    			'scale-in': {
    				'0%': {
    					transform: 'scale(0.96)',
    					opacity: '0'
    				},
    				'100%': {
    					transform: 'scale(1)',
    					opacity: '1'
    				}
    			},
    			'slide-up': {
    				'0%': {
    					opacity: '0',
    					transform: 'translateY(16px)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translateY(0)'
    				}
    			},
    			'slide-down': {
    				'0%': {
    					opacity: '0',
    					transform: 'translateY(-16px)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translateY(0)'
    				}
    			},
    			'shimmer': {
    				'0%': {
    					backgroundPosition: '200% center'
    				},
    				'100%': {
    					backgroundPosition: '-200% center'
    				}
    			},
    			'breathe': {
    				'0%, 100%': {
    					opacity: '1'
    				},
    				'50%': {
    					opacity: '0.85'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.25s ease-out',
    			'accordion-up': 'accordion-up 0.25s ease-out',
    			'fade-in': 'fade-in 0.4s ease-out',
    			'scale-in': 'scale-in 0.3s ease-out',
    			'slide-up': 'slide-up 0.5s ease-out',
    			'slide-down': 'slide-down 0.5s ease-out',
    			'shimmer': 'shimmer 3s ease-in-out infinite',
    			'breathe': 'breathe 4s ease-in-out infinite'
    		},
    	}
    },
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
