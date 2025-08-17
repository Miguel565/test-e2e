const { test, expect, beforeEach, describe } = require('@playwright/test');
const { loginWith } = require('./helper')

describe('Blog app', () => {
    beforeEach(async ({ page, request }) => {
        await request.post('http://localhost:3001/api/testing/reset')
        await request.post('http://localhost:3001/api/users', {
            data: {
                name: 'Porgas D. Ace',
                username: 'ace',
                password: 'puño de fuego'
            }
        })
        await page.goto('http://localhost:5173')
    })

    test('login form is shown', async ({ page }) => {
        await page.getByRole('button', { name: 'login' })
        await page.waitForLoadState('domcontentloaded')
        const loginForm = await page.locator('#form')
        await expect(loginForm).toBeVisible()
    })

    describe('Login', () => {
        test('succeeds with correct credentials', async ({ page }) => {
            await loginWith(page, 'ace', 'puño de fuego')

            await expect(getByText('Porgas D. Ace logged in')).toBeVisible()
        })

        test('fails with wrong password', async ({ page }) => {
            await loginWith(page, 'ace', 'fire wrong')

            const errorDiv = await page.locator('.error')
            await expect(errorDiv).toContainText('Wrong user or password')
            await expect(errorDiv).toHaveCSS('border-style', 'solid')
            await expect(errorDiv).toHaveCSS('color', 'rgb(255, 0, 0)')
            await expect(await page.getByText('Porgas D. Ace logged in')).not.toBeVisible()
        })
    })
})