const { test, expect, beforeEach, describe } = require('@playwright/test');

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
})