const login = async (page, username, password) => {
  const loginForm = page.getByTestId('login-form')
  const usernameInput = loginForm.getByText('username').getByRole('textbox')
  const passwordInput = loginForm.getByText('password').getByRole('textbox')
  const loginBtn = loginForm.getByRole('button', { name: 'login' })
  await usernameInput.fill(username)
  await passwordInput.fill(password)
  await loginBtn.click()
}

module.exports = { login }
