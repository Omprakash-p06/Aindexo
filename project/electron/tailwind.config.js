/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./renderer/**/*.{html,js,jsx}"],
    theme: {
        extend: {
            colors: {
                glass: "rgba(255, 255, 255, 0.1)",
                glassBorder: "rgba(255, 255, 255, 0.2)",
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}
