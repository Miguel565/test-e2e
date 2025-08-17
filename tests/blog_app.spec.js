const { test, expect, beforeEach, describe } = require('@playwright/test');
const { loginWith, createNewBlog } = require('./helper')

describe('Blog app', () => {
    beforeEach(async ({ page, request }) => {
        await request.post('/api/testing/reset')
        await request.post('/api/users', {
            data: {
                name: 'Porgas D. Ace',
                username: 'ace',
                password: 'puño de fuego'
            }
        })
        await page.goto('/')
    })

    test('login form is shown', async ({ page }) => {
        page.getByRole('button', { name: 'login' })
        await page.waitForLoadState('domcontentloaded')
        const loginForm = page.locator('#form')
        await expect(loginForm).toBeVisible({ timeout: 10000 })
    })

    describe('Login', () => {
        test('succeeds with correct credentials', async ({ page }) => {
            await loginWith(page, 'ace', 'puño de fuego')

            await expect(page.getByText('Porgas D. Ace logged in')).toBeVisible()
        })

        test('fails with wrong password', async ({ page }) => {
            await loginWith(page, 'ace', 'fire wrong')

            const errorDiv = await page.locator('.error')
            await expect(errorDiv).toContainText('Wrong user or password')
            await expect(errorDiv).toHaveCSS('border-style', 'solid')
            await expect(errorDiv).toHaveCSS('color', 'rgb(255, 0, 0)')
            await expect(page.getByText('Porgas D. Ace logged in')).not.toBeVisible()
        })
        
        describe('When logged in', () => {
            test('create a new blog', async ({ page }) => {
                await loginWith(page, 'ace', 'puño de fuego')

                // Espera a que el formulario de creación de blog esté visible
                await page.getByText('create new blog').click()
                await expect(page.locator('#blog-form')).toBeVisible({ timeout: 10000 })

                await createNewBlog(page, 'Nuevo Blog de Prueba', 'Author de Prueba', 'https://ejemplo.com/blog')

                // Verifica que el nuevo blog aparece en la lista
                await expect(page.getByText('Nuevo Blog de Prueba')).toBeVisible({ timeout: 10000 })
            })
        })
    })
})