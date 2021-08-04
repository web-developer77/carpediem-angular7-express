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

describe('User standard plans', () => {
  const page: PageObjects = new PageObjects()

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

  it('Visualize user\'s profile section', async() => {
    const { username, $key } = e2eUser
    const el = page.getUserProfileTitle()

    page.navigateTo(`carpe/profile/${$key}`)

    browser.wait(ExpectedConditions.visibilityOf(el), timeout)
    browser.sleep(500)

    expect(el.getText()).toEqual(`Hola, ${username}`)
  })

  it('Book with no credits', async() => {
    browser.ignoreSynchronization = true

    const activeFilter = page.getActiveBookingFilter()
    page.navigateTo('carpe/book')

    browser.wait(ExpectedConditions.visibilityOf(activeFilter), timeout)
    page.getE2eClassBtn().click()
    browser.sleep(4000)
    const cl = await page.getFirstBike()
    cl.click()

    const classesBtn = page.getPackageBtn(1)
    browser.wait(ExpectedConditions.visibilityOf(classesBtn), timeout)
    browser.sleep(2000)
    classesBtn.click()
  })

  it('Buy demo class', async() => {
    const classesBtn = page.getPackageBtn(0)
    const formElements = page.getCardForm()
    page.navigateTo('carpe/buy?e2e=true')

    browser.wait(ExpectedConditions.visibilityOf(classesBtn), timeout)
    browser.sleep(1000)
    classesBtn.click()
    browser.wait(ExpectedConditions.visibilityOf(formElements[0]), timeout)
    testCard.map((field, index) => formElements[index].sendKeys(field))
    page.getSubmitBtn().click()
    browser.wait(ExpectedConditions.visibilityOf(page.getConfirmationModalTitle()), timeout)
    page.getModalConfirmationBtn().click()

    const url = await browser.wait(ExpectedConditions.urlContains('carpe/book'), timeout)
    expect(url).toEqual(true)
  })

  it('Buy 1 class', async() => {
    const classesBtn = page.getPackageBtn(1)
    page.navigateTo('carpe/buy?e2e=true')

    browser.wait(ExpectedConditions.visibilityOf(classesBtn), timeout)
    browser.sleep(1000)
    classesBtn.click()
    browser.wait(ExpectedConditions.visibilityOf(page.getSubmitBtn()), timeout)
    page.getSubmitBtn().click()
    browser.wait(ExpectedConditions.visibilityOf(page.getConfirmationModalTitle()), timeout)
    page.getModalConfirmationBtn().click()

    const url = await browser.wait(ExpectedConditions.urlContains('carpe/book'), timeout)
    expect(url).toEqual(true)
  })

  it('Buy 5 classes', async() => {
    const classesBtn = page.getPackageBtn(2)
    page.navigateTo('carpe/buy?e2e=true')

    browser.wait(ExpectedConditions.visibilityOf(classesBtn), timeout)
    browser.sleep(1000)
    classesBtn.click()
    browser.wait(ExpectedConditions.visibilityOf(page.getSubmitBtn()), timeout)
    page.getSubmitBtn().click()
    browser.wait(ExpectedConditions.visibilityOf(page.getConfirmationModalTitle()), timeout)
    page.getModalConfirmationBtn().click()

    const url = await browser.wait(ExpectedConditions.urlContains('carpe/book'), timeout)
    expect(url).toEqual(true)
  })

  it('Buy 10 classes', async() => {
    const classesBtn = page.getPackageBtn(3)
    page.navigateTo('carpe/buy?e2e=true')

    browser.wait(ExpectedConditions.visibilityOf(classesBtn), timeout)
    browser.sleep(1000)
    classesBtn.click()
    browser.wait(ExpectedConditions.visibilityOf(page.getSubmitBtn()), timeout)
    page.getSubmitBtn().click()
    browser.wait(ExpectedConditions.visibilityOf(page.getConfirmationModalTitle()), timeout)
    page.getModalConfirmationBtn().click()

    const url = await browser.wait(ExpectedConditions.urlContains('carpe/book'), timeout)
    expect(url).toEqual(true)
  })

  it('Buy 25 classes', async() => {
    const classesBtn = page.getPackageBtn(4)
    page.navigateTo('carpe/buy?e2e=true')

    browser.wait(ExpectedConditions.visibilityOf(classesBtn), timeout)
    browser.sleep(1000)
    classesBtn.click()
    browser.wait(ExpectedConditions.visibilityOf(page.getSubmitBtn()), timeout)
    page.getSubmitBtn().click()
    browser.wait(ExpectedConditions.visibilityOf(page.getConfirmationModalTitle()), timeout)
    page.getModalConfirmationBtn().click()

    const url = await browser.wait(ExpectedConditions.urlContains('carpe/book'), timeout)
    expect(url).toEqual(true)
  })

  it('Buy 50 classes', async() => {
    const classesBtn = page.getPackageBtn(5)
    page.navigateTo('carpe/buy?e2e=true')

    browser.wait(ExpectedConditions.visibilityOf(classesBtn), timeout)
    browser.sleep(1000)
    classesBtn.click()
    browser.wait(ExpectedConditions.visibilityOf(page.getSubmitBtn()), timeout)
    page.getSubmitBtn().click()

    const url = await browser.wait(ExpectedConditions.urlContains('3dsecure-auth-simulator'), timeout)
    expect(url).toEqual(true)
  })

  it('Verifies amount of credits after buy all standard plans', async() => {
    const { $key } = e2eUser

    page.navigateTo(`carpe/profile/${$key}`)
    browser.wait(ExpectedConditions.visibilityOf(page.getUserCreditsCount()), timeout)
    browser.sleep(1000)
    const count = await page.getUserCreditsCount().getText()
    expect(parseInt(count)).toEqual(42)
  })

  it('Book with credits', async() => {
    const activeFilter = page.getActiveBookingFilter()
    page.navigateTo('carpe/book')

    browser.wait(ExpectedConditions.visibilityOf(activeFilter), timeout)
    page.getE2eClassBtn().click()
    browser.sleep(4000)
    const cl = await page.getFirstBike()
    cl.click()
    browser.sleep(4000)
    const continueBtn = page.getContinueBtn()
    browser.wait(ExpectedConditions.visibilityOf(continueBtn), timeout)
    continueBtn.click()
    const confirmBtn = page.getConfimationScreenBtn()
    browser.sleep(4000)
    confirmBtn.click()
  })
})
