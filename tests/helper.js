const loginWith = async (page, username, password) => {
    await page.getByRole('button', { name: 'login' }).click()
    await page.waitForLoadState('domcontentloaded')

    await page.getByTestId('username').waitFor({ state: 'visible', timeout: 5000 })
    await page.getByTestId('username').fill(username)
    await page.getByTestId('password').waitFor({ state: 'visible', timeout: 5000 })
    await page.getByTestId('password').fill(password)

    await Promise.all([
        page.waitForResponse(response => response.url().includes('/api/login')
            && response.status() === 200, { timeout: 10000 }),
        page.getByText('Login').click()
    ])
}

const createNewBlog = async (page, title, author, url) => {
    // Rellena los campos del blog
    await page.getByTestId('blog-title').fill(title)
    await page.getByTestId('blog-author').fill(author)
    await page.getByTestId('blog-url').fill(url)

    // Envía el formulario
    await page.getByText('create').click()
}

export { loginWith, createNewBlog }