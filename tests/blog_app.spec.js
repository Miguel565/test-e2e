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
        page.getByRole('button', { name: 'login' }).click()
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

            test('edit likes of a blog', async ({ page }) => {
                await loginWith(page, 'ace', 'puño de fuego')

                // Crear un blog para editar
                await page.getByText('create new blog').click()
                await expect(page.locator('#blog-form')).toBeVisible({ timeout: 10000 })
                await createNewBlog(page, 'Blog para editar likes', 'Autor', 'https://ejemplo.com/edit')
                await expect(page.getByText('Blog para editar likes')).toBeVisible({ timeout: 10000 })

                // Mostrar detalles del blog (puede requerir un botón 'view' o similar)
                await page.getByText('view').click()
                // Espera a que el campo de likes esté visible
                const likesLocator = page.getByTestId('likes')
                await expect(likesLocator).toBeVisible({ timeout: 10000 })

                // Editar los likes (puede ser un botón 'like' o un campo editable)
                const likeButton = page.getByTestId('like-button')
                await likeButton.click()

                // Verifica que los likes aumentaron (asume que el valor inicial es 0)
                await expect(likesLocator).toHaveText('1', { timeout: 10000 })
            })

            test('user can delete their own blog', async ({ page }) => {
                await loginWith(page, 'ace', 'puño de fuego')

                // Crear un blog para eliminar
                await page.getByText('create new blog').click()
                await expect(page.locator('#blog-form')).toBeVisible({ timeout: 10000 })
                await createNewBlog(page, 'Blog para eliminar', 'Autor', 'https://ejemplo.com/delete')
                await expect(page.getByText('Blog para eliminar')).toBeVisible({ timeout: 10000 })

                // Mostrar detalles del blog (puede requerir un botón 'view')
                await page.getByText('view').click()

                // Manejar el diálogo de confirmación al eliminar
                await page.once('dialog', async dialog => {
                    await dialog.accept(); // Confirmar eliminación
                });

                // Haz clic en el botón de eliminar
                await page.getByText('delete').click()

                // Verifica que el blog ya no aparece en la lista
                await expect(page.getByText('Blog para eliminar')).not.toBeVisible({ timeout: 10000 })
            })
        })
    })
})