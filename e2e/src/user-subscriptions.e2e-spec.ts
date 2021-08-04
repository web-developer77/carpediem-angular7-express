import { PageObjects } from './user-objects'
import { browser, ExpectedConditions } from 'protractor'

const timeout = 50000

const e2eUser = {
  email: 'user@e2e.com',
  pass: 'user123',
  username: 'User e2e',
  $key: '44pSeqcMIe0eTxBV5lmi'
}

const testCard = [
  'User e2e',
  '4111111111111111',
  12,
  22,
  332
]

describe('User subscription plans', () => {
  let page: PageObjects = new PageObjects()

  it('Display welcome message', () => {
    page.navigateTo('login')

    expect(page.getTitleText()).toEqual('¡Bienvenido a Carpe Diem!')
  })

  it('Sign in as normal user', async() => {
    const { email, pass } = e2eUser
    const submitBtn = page.getSubmitBtn()
    const emailInput = page.getEmailInput()
    const passInput = page.getPasswordInput()

    emailInput.sendKeys(email)
    passInput.sendKeys(pass)
    submitBtn.click()

    const url = await browser.wait(ExpectedConditions.urlContains('carpe/home'), timeout)

    expect(url).toEqual(true)
  })

  it('Buy limited month subscription', async() => {
    browser.ignoreSynchronization = true

    const classesBtn = page.getPackageBtn(6)
    const formElements = page.getCardForm()
    page.navigateTo('carpe/buy?e2e=true')

    browser.wait(ExpectedConditions.visibilityOf(classesBtn), timeout)
    browser.sleep(500)
    classesBtn.click()
    browser.wait(ExpectedConditions.visibilityOf(formElements[0]), timeout)
    testCard.map((field, index) => formElements[index].sendKeys(field))
    page.getSubmitBtn().click()
    browser.wait(ExpectedConditions.visibilityOf(page.getConfirmationModalTitle()), timeout)
    page.getModalConfirmationBtn().click()

    page.navigateTo('carpe/book')

    const url = await browser.wait(ExpectedConditions.urlContains('carpe/book'), timeout)
    expect(url).toEqual(true)
  })

  it('Buy unlimited month subscription', async() => {
    const classesBtn = page.getPackageBtn(7)
    const formElements = page.getCardForm()
    page.navigateTo('carpe/buy?e2e=true')

    browser.wait(ExpectedConditions.visibilityOf(classesBtn), timeout)
    browser.sleep(500)
    classesBtn.click()
    browser.wait(ExpectedConditions.visibilityOf(formElements[0]), timeout)
    testCard.map((field, index) => formElements[index].sendKeys(field))
    page.getSubmitBtn().click()
    browser.wait(ExpectedConditions.visibilityOf(page.getConfirmationModalTitle()), timeout)
    page.getModalConfirmationBtn().click()

    page.navigateTo('carpe/book')

    const url = await browser.wait(ExpectedConditions.urlContains('carpe/book'), timeout)
    expect(url).toEqual(true)
  })

  it('Buy unlimited year subscription', async() => {
    const classesBtn = page.getPackageBtn(8)
    const formElements = page.getCardForm()
    page.navigateTo('carpe/buy?e2e=true')

    browser.wait(ExpectedConditions.visibilityOf(classesBtn), timeout)
    browser.sleep(500)
    classesBtn.click()
    browser.wait(ExpectedConditions.visibilityOf(formElements[0]), timeout)
    testCard.map((field, index) => formElements[index].sendKeys(field))
    page.getSubmitBtn().click()
    browser.wait(ExpectedConditions.visibilityOf(page.getConfirmationModalTitle()), timeout)
    page.getModalConfirmationBtn().click()

    page.navigateTo('carpe/book')

    const url = await browser.wait(ExpectedConditions.urlContains('carpe/book'), timeout)
    expect(url).toEqual(true)
  })
})
