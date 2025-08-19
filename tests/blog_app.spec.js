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
        await request.post('/api/users', {
            data: {
                name: 'Roronoa Zoro',
                username: 'zoro',
                password: 'tres espadas'
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
            beforeEach(async ({ page }) => {
                await loginWith(page, 'ace', 'puño de fuego')
            })

            test('create a new blog', async ({ page }) => {
                // Espera a que el formulario de creación de blog esté visible
                await page.getByText('create new blog').click()
                await expect(page.locator('.form')).toBeVisible({ timeout: 10000 })

                await createNewBlog(page, 'Nuevo Blog de Prueba', 'Author de Prueba', 'https://ejemplo.com/blog')
                await createNewBlog(page, 'Otro nuevo blog de prueba', 'Autor Test', 'https://www.ejemplo.com/blog')

                // Verifica que el nuevo blog aparece en la lista
                const li = page.locator('li')
                await expect(li).toBeVisible({ timeout: 10000 })
                await expect(li.filter({ hasText: 'Nuevo Blog de Prueba' })).toBeVisible({ timeout: 10000 })
                await expect(li.filter({ hasText: 'Otro nuevo blog de prueba' })).toBeVisible({ timeout: 10000 })
            })

            test('edit likes of a blog', async ({ page }) => {
                // Crear un blog para editar
                await page.getByText('create new blog').click()
                await expect(page.locator('.form')).toBeVisible({ timeout: 10000 })
                await createNewBlog(page, 'Blog para editar likes', 'Autor', 'https://ejemplo.com/edit')

                // Busca el blog especifico
                const blogToLike = page.locator('li', { hasText: 'Blog para editar likes' })
                await expect(blogToLike).toBeVisible({ timeout: 10000 })

                // Mostrar detalles del blog (puede requerir un botón 'view' o similar)
                await blogToLike.getByRole('button', { name: 'view' }).click()

                // Espera a que el campo de likes esté visible
                await expect(blogToLike.getByTestId('likes')).toBeVisible({ timeout: 10000 })

                // Editar los likes (puede ser un botón 'like' o un campo editable)
                await blogToLike.getByTestId('like-button').click()

                // Verifica que los likes aumentaron (asume que el valor inicial es 0)
                await expect(blogToLike.getByTestId('likes')).toHaveText('1', { timeout: 10000 })
            })

            describe('deleting a blog', () => {
                beforeEach(async ({ page }) => {
                    // Crear un blog para eliminar
                    await page.getByText('create new blog').click()
                    await createNewBlog(page, 'Blog para eliminar', 'Autor', 'https://ejemplo.com/delete')
                })

                test('blogs are ordered by likes, most liked first', async ({ page }) => {
                    // Crear dos blogs
                    await page.getByText('create new blog').click()
                    await createNewBlog(page, 'Blog con pocos likes', 'Autor', 'https://ejemplo.com/low')
                    await page.getByText('create new blog').click()
                    await createNewBlog(page, 'Blog con muchos likes', 'Autor', 'https://ejemplo.com/high')

                    // Dar likes al segundo blog
                    const blogs = page.locator('li')
                    const blogHigh = blogs.filter({ hasText: 'Blog con muchos likes' })
                    await blogHigh.getByRole('button', { name: 'view' }).click()
                    await blogHigh.getByTestId('like-button').click()
                    await blogHigh.getByTestId('like-button').click()
                    await blogHigh.getByTestId('like-button').click() // 3 likes

                    // Dar likes al primer blog
                    const blogLow = blogs.filter({ hasText: 'Blog con pocos likes' })
                    await blogLow.getByRole('button', { name: 'view' }).click()
                    await blogLow.getByTestId('like-button').click() // 1 like

                    // Espera a que los likes se actualicen
                    await expect(blogHigh.getByTestId('likes')).toHaveText('3', { timeout: 10000 })
                    await expect(blogLow.getByTestId('likes')).toHaveText('1', { timeout: 10000 })

                    // Verifica el orden: el blog con más likes debe estar primero
                    const blogTitles = await page.locator('li').locator('h3').allTextContents()
                    expect(blogTitles[0]).toContain('Blog con muchos likes')
                    expect(blogTitles[1]).toContain('Blog con pocos likes')
                })

                test('user can delete their own blog', async ({ page }) => {
                    // Verifica la lista de todos los blogs
                    const blogToDelete = page.locator('li', { hasText: 'Blog para eliminar' })
                    await expect(blogToDelete).toBeVisible({ timeout: 10000 })

                    // Mostrar detalles del blog (puede requerir un botón 'view')
                    await blogToDelete.getByRole('button', { name: 'view' }).click()

                    // Manejar el diálogo de confirmación al eliminar
                    await page.once('dialog', async dialog => {
                        await dialog.accept(); // Confirmar eliminación
                    });

                    // Haz clic en el botón de eliminar
                    await blogToDelete.getByText('remove').click()

                    // Verifica que el blog ya no aparece en la lista
                    await expect(blogToDelete).not.toBeVisible({ timeout: 10000 })
                })

                test('user cannot delete another user\'s blog', async ({ page }) => {
                    // Crear un blog para eliminar
                    await page.getByText('create new blog').click()
                    await expect(page.locator('.form')).toBeVisible({ timeout: 10000 })
                    await createNewBlog(page, 'Blog para eliminar', 'Author', 'http://www.ejemplo.com/delete')

                    // Cierra sesion del usuario "ace"
                    await page.getByText('Logout').click()

                    // Inicia sesion con usuario "zoro"
                    await loginWith(page, 'zoro', 'tres espadas')

                    // Verifica la lista de blogs
                    const blogToDelete = page.locator('li', { hasText: 'Blog para eliminar' })
                    await expect(blogToDelete).toBeVisible({ timeout: 10000 })
                    await blogToDelete.getByRole('button', { name: 'view' }).click()

                    // Verifica la visibilidad del botón eliminar
                    await expect(blogToDelete.getByText('remove')).not.toBeVisible({ timeout: 10000 })
                })
            })
        })
    })
}) 