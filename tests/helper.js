const loginWith = async (page, username, password) => {
	await page.getByRole('button', { name: 'login' })
	await page.getByTestId('username').fill(username)
	await page.getByTestId('password').fill(password)
	await page.getByText('Login').click()
}

export { loginWith }