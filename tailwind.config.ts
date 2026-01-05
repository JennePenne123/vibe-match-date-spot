
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
    			'Playfair Display',
    			'serif'
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
    			brand: {
    				'50': 'hsl(var(--brand-50))',
    				'100': 'hsl(var(--brand-100))',
    				'200': 'hsl(var(--brand-200))',
    				'300': 'hsl(var(--brand-300))',
    				'400': 'hsl(var(--brand-400))',
    				'500': 'hsl(var(--brand-500))',
    				'600': 'hsl(var(--brand-600))',
    				'700': 'hsl(var(--brand-700))',
    				'800': 'hsl(var(--brand-800))',
    				'900': 'hsl(var(--brand-900))'
    			},
    			success: {
    				'50': 'hsl(var(--success-50))',
    				'500': 'hsl(var(--success-500))',
    				'600': 'hsl(var(--success-600))'
    			},
    			warning: {
    				'50': 'hsl(var(--warning-50))',
    				'500': 'hsl(var(--warning-500))',
    				'600': 'hsl(var(--warning-600))'
    			},
    			error: {
    				'50': 'hsl(var(--error-50))',
    				'500': 'hsl(var(--error-500))',
    				'600': 'hsl(var(--error-600))'
    			},
    			glass: {
    				white: 'hsl(var(--glass-white))',
    				neutral: 'hsl(var(--glass-neutral))',
    				dark: 'hsl(var(--glass-dark))'
    			}
    		},
    		backgroundImage: {
    			'gradient-primary': 'var(--gradient-primary)',
    			'gradient-secondary': 'var(--gradient-secondary)',
    			'gradient-accent': 'var(--gradient-accent)',
    			'gradient-romantic': 'var(--gradient-romantic)',
    			'gradient-dreamy': 'var(--gradient-dreamy)',
    			'gradient-surface-light': 'var(--gradient-surface-light)',
    			'gradient-surface-dark': 'var(--gradient-surface-dark)',
    			'gradient-glass-light': 'var(--gradient-glass-light)',
    			'gradient-glass-dark': 'var(--gradient-glass-dark)',
    			'venue-gradient': 'var(--gradient-venue)',
    			'venue-ai-gradient': 'var(--gradient-venue-ai)'
    		},
    		boxShadow: {
    			'premium-sm': 'var(--shadow-premium-sm)',
    			'premium-md': 'var(--shadow-premium-md)',
    			'premium-lg': 'var(--shadow-premium-lg)',
    			'premium-xl': 'var(--shadow-premium-xl)',
    			'glow-sm': 'var(--shadow-glow-sm)',
    			'glow-md': 'var(--shadow-glow-md)',
    			'glow-lg': 'var(--shadow-glow-lg)',
    			glass: 'var(--shadow-glass)',
    			'glass-strong': 'var(--shadow-glass-strong)',
    			'2xs': 'var(--shadow-2xs)',
    			xs: 'var(--shadow-xs)',
    			sm: 'var(--shadow-sm)',
    			md: 'var(--shadow-md)',
    			lg: 'var(--shadow-lg)',
    			xl: 'var(--shadow-xl)',
    			'2xl': 'var(--shadow-2xl)'
    		},
    		backdropBlur: {
    			glass: 'var(--blur-glass)',
    			'glass-strong': 'var(--blur-glass-strong)'
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
    				'0%': {
    					opacity: '0',
    					transform: 'translateY(10px)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translateY(0)'
    				}
    			},
    			'scale-in': {
    				'0%': {
    					transform: 'scale(0.95)',
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
    					transform: 'translateY(20px)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translateY(0)'
    				}
    			},
    			'slide-down': {
    				'0%': {
    					opacity: '0',
    					transform: 'translateY(-20px)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translateY(0)'
    				}
    			},
    			shimmer: {
    				'0%': {
    					backgroundPosition: '200% center'
    				},
    				'100%': {
    					backgroundPosition: '-200% center'
    				}
    			},
    			'spin-in': {
    				'0%': {
    					transform: 'rotate(-180deg) scale(0)',
    					opacity: '0'
    				},
    				'100%': {
    					transform: 'rotate(0deg) scale(1)',
    					opacity: '1'
    				}
    			},
    			'spin-out': {
    				'0%': {
    					transform: 'rotate(0deg) scale(1)',
    					opacity: '1'
    				},
    				'100%': {
    					transform: 'rotate(180deg) scale(0)',
    					opacity: '0'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			'fade-in': 'fade-in 0.3s ease-out',
    			'scale-in': 'scale-in 0.2s ease-out',
    			'slide-up': 'slide-up 0.4s ease-out',
    			'slide-down': 'slide-down 0.4s ease-out',
    			shimmer: 'shimmer 3s ease-in-out infinite',
    			'spin-in': 'spin-in 0.4s ease-out forwards',
    			'spin-out': 'spin-out 0.4s ease-out forwards'
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
    			serif: [
    				'Crimson Pro',
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
    		}
    	}
    },
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
