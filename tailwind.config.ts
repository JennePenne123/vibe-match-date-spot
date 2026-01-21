
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
    			// Modern vibrant palette
    			indigo: {
    				'50': 'hsl(226, 100%, 97%)',
    				'100': 'hsl(226, 100%, 94%)',
    				'200': 'hsl(228, 96%, 89%)',
    				'300': 'hsl(230, 94%, 82%)',
    				'400': 'hsl(234, 89%, 74%)',
    				'500': 'hsl(239, 84%, 67%)',
    				'600': 'hsl(243, 75%, 59%)',
    				'700': 'hsl(245, 58%, 51%)',
    				'800': 'hsl(244, 55%, 41%)',
    				'900': 'hsl(242, 47%, 34%)'
    			},
    			violet: {
    				'50': 'hsl(270, 100%, 98%)',
    				'100': 'hsl(269, 100%, 95%)',
    				'200': 'hsl(269, 100%, 92%)',
    				'300': 'hsl(269, 97%, 85%)',
    				'400': 'hsl(267, 96%, 76%)',
    				'500': 'hsl(263, 70%, 66%)',
    				'600': 'hsl(262, 83%, 58%)',
    				'700': 'hsl(263, 70%, 50%)',
    				'800': 'hsl(263, 69%, 42%)',
    				'900': 'hsl(264, 67%, 35%)'
    			},
    			pink: {
    				'50': 'hsl(327, 73%, 97%)',
    				'100': 'hsl(326, 78%, 95%)',
    				'200': 'hsl(326, 85%, 90%)',
    				'300': 'hsl(327, 87%, 82%)',
    				'400': 'hsl(329, 86%, 70%)',
    				'500': 'hsl(330, 81%, 60%)',
    				'600': 'hsl(333, 71%, 51%)',
    				'700': 'hsl(335, 78%, 42%)',
    				'800': 'hsl(336, 74%, 35%)',
    				'900': 'hsl(336, 69%, 30%)'
    			},
    			slate: {
    				'50': 'hsl(210, 40%, 98%)',
    				'100': 'hsl(210, 40%, 96%)',
    				'200': 'hsl(214, 32%, 91%)',
    				'300': 'hsl(213, 27%, 84%)',
    				'400': 'hsl(215, 20%, 65%)',
    				'500': 'hsl(215, 16%, 47%)',
    				'600': 'hsl(215, 19%, 35%)',
    				'700': 'hsl(217, 33%, 25%)',
    				'800': 'hsl(217, 33%, 17%)',
    				'900': 'hsl(222, 47%, 11%)'
    			},
    			success: {
    				'50': 'hsl(160, 100%, 97%)',
    				'500': 'hsl(160, 84%, 39%)',
    				'600': 'hsl(160, 80%, 35%)'
    			},
    			warning: {
    				'50': 'hsl(43, 100%, 97%)',
    				'500': 'hsl(43, 96%, 56%)',
    				'600': 'hsl(43, 92%, 50%)'
    			},
    			error: {
    				'50': 'hsl(0, 100%, 97%)',
    				'500': 'hsl(0, 84%, 60%)',
    				'600': 'hsl(0, 80%, 55%)'
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
    			'gradient-romantic': 'var(--gradient-secondary)',
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
    			// Glow shadows
    			'glow-primary': 'var(--shadow-glow-primary)',
    			'glow-secondary': 'var(--shadow-glow-secondary)',
    			'glow-accent': 'var(--shadow-glow-accent)',
    			// Legacy mappings
    			'premium-sm': 'var(--shadow-gentle-sm)',
    			'premium-md': 'var(--shadow-gentle-md)',
    			'premium-lg': 'var(--shadow-gentle-lg)',
    			'premium-xl': 'var(--shadow-gentle-xl)',
    			'glow-sm': 'var(--shadow-focus)',
    			'glow-md': 'var(--shadow-glow-primary)',
    			'glow-lg': 'var(--shadow-glow-primary)',
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
    			'300': '300ms',
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
    			'pulse-glow': {
    				'0%, 100%': {
    					boxShadow: '0 0 10px hsl(var(--primary) / 0.3)'
    				},
    				'50%': {
    					boxShadow: '0 0 20px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.2)'
    				}
    			},
    			'card-tap': {
    				'0%, 100%': { transform: 'scale(1)' },
    				'50%': { transform: 'scale(0.98)' }
    			},
    			'heart-bounce': {
    				'0%, 100%': { transform: 'scale(1)' },
    				'25%': { transform: 'scale(1.2)' },
    				'50%': { transform: 'scale(0.95)' },
    				'75%': { transform: 'scale(1.1)' }
    			},
    			'spin-in': {
    				'0%': { transform: 'rotate(-90deg) scale(0)', opacity: '0' },
    				'100%': { transform: 'rotate(0) scale(1)', opacity: '1' }
    			},
    			'spin-out': {
    				'0%': { transform: 'rotate(0) scale(1)', opacity: '1' },
    				'100%': { transform: 'rotate(90deg) scale(0)', opacity: '0' }
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.25s ease-out',
    			'accordion-up': 'accordion-up 0.25s ease-out',
    			'fade-in': 'fade-in 0.3s ease-out',
    			'scale-in': 'scale-in 0.2s ease-out',
    			'slide-up': 'slide-up 0.4s ease-out',
    			'slide-down': 'slide-down 0.4s ease-out',
    			'shimmer': 'shimmer 2s ease-in-out infinite',
    			'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
    			'card-tap': 'card-tap 0.15s ease-out',
    			'heart-bounce': 'heart-bounce 0.4s ease-out',
    			'spin-in': 'spin-in 0.3s ease-out',
    			'spin-out': 'spin-out 0.2s ease-in'
    		},
    	}
    },
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
