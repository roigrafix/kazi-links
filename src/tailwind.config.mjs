/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}', './public/**/*.html'],
    theme: {
        extend: {
            fontSize: {
                xs: ['0.75rem', { lineHeight: '1.2', letterSpacing: '0.02em', fontWeight: '400' }],
                sm: ['0.875rem', { lineHeight: '1.3', letterSpacing: '0.02em', fontWeight: '400' }],
                base: ['1rem', { lineHeight: '1.5', letterSpacing: '0.025em', fontWeight: '400' }],
                lg: ['1.125rem', { lineHeight: '1.5', letterSpacing: '0.025em', fontWeight: '400' }],
                xl: ['1.25rem', { lineHeight: '1.5', letterSpacing: '0.025em', fontWeight: '500' }],
                '2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '500' }],
                '3xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '0.02em', fontWeight: '600' }],
                '4xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '0.015em', fontWeight: '600' }],
                '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '0.01em', fontWeight: '700' }],
                '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '0em', fontWeight: '700' }],
                '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.01em', fontWeight: '800' }],
                '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.015em', fontWeight: '800' }],
                '9xl': ['8rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '900' }],
            },
            fontFamily: {
                heading: "roboto",
                paragraph: "roboto"
            },
            colors: {
                brightpink: '#FF2EE0',
                electricblue: '#5A7FFF',
                palemint: '#CFF6E4',
                neonyellow: '#F7FF3C',
                foreground: '#ffffff',
                destructive: '#DF3131',
                destructiveforeground: '#FFFFFF',
                background: '#000000',
                secondary: '#FFFFFF',
                'secondary-foreground': '#000000',
                'primary-foreground': '#FFFFFF',
                primary: '#000000'
            },
        },
    },
    future: {
        hoverOnlyWhenSupported: true,
    },
    plugins: [require('@tailwindcss/container-queries'), require('@tailwindcss/typography')],
}
