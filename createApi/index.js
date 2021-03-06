const fs = require('fs')
const path = require('path')
const [_from, _to, _mock] = ['./_api.js', './api.js', './mock.js']

let apiContent = `
import ajax from './core'
import { aes } from '@/global'\n
export default {
  account: {
    login: ({username, password}) => ajax({url: 'account/login',
      data: {
        username: username && aes.encrypt(username),
        password: password && aes.encrypt(password)
      },
      whereCatch: 'local'
    }),
    logout: () => ajax({url: 'account/logout', whereCatch: 'local'}),
    info: () => ajax({url: 'account/info', whereCatch: 'local'}),
    setting: data => ajax({url: 'account/setting',
      data: {
        ...data,
        old_pwd: data.old_pwd && aes.encrypt(data.old_pwd),
        new_pwd: data.old_pwd && aes.encrypt(data.new_pwd),
        repwd: data.old_pwd && aes.encrypt(data.repwd)
      }
    })
  },
`
let mockContent = `
export default {
`

fs.readFile(_from, (err, res) => {
  const data = res.toString()
  let arrApi = data.split(/\*\/\s*\n*\/\*\*/)
  let allApi = {}
  arrApi.forEach((item, index) => {
    let $api = /@api\s\{\w+\}\s([/a-zA-Z_]+)\s(.+)/.exec(item)
    let path = $api[1].toLowerCase()
    let cnInfo = $api[2]
    let mock = item.replace(/\*.*/g, '').trim()
    let [module, action] = path.split('/')
    if (module === 'account') return
    allApi[module] = allApi[module] || {}
    allApi[module][action] = `data => ajax({url: '${path}', data})`
    index && (mockContent += `${index === 1 ? '' : '\n'}// '${cnInfo}':
    '/local/${path}':
    ${mock},`)
  })
  // 生成 api
  fs.writeFile(_to, apiContent + JSON.stringify(allApi, null, 2).replace(/"/g, '').slice(1) + '\n')
  // 生成 mock 数据
  fs.writeFile(_mock, mockContent.replace(/,$/, '\n}'))
})