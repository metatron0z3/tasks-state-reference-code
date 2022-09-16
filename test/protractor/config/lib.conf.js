module.exports = {

  // Determines if test should stop continuing upon failure
  bail:{

    // If false, test will continue to next specs after failure of the current spec (recommended: true)
    enabled: true,

    // If true, test will stop only upon critical errors (recommended: true)
    criticalOnly: true

  },

  // Determines the amount of time test should wait for a process to finish
  timeout: {

    spec: {
      low: 60000,
      medium: 120000,
      high: 350000
    },

    waiting: 10000

  },

  // The trooper settings to sign up with
  trooper: {

    // Change the first and last name to yours
    name: {
      first: 'Ramtin',
      last: 'Soltani'
    },

    secondaryName: {
      first: 'Saul',
      last: 'Goodman'
    },

    // Change phone, secondaryPhone, and password to yours (make sure to include +1 in phones)
    phone: '+16198820192',
    secondaryPhone: '+16195550192',
    password: 'password'

  },

  // Lists of credentials to test signup/login verifications
  validations: {

    signup: {

      phones: [
        '+16198820192',   // US, Area code 619
        '+989127205025',  // IR, Area code 912
        '+989213328928',  // IR, Carrier code 921
        '+989101499384',  // IR, Carrier code 910
        '+541165896321',  // AR, Area code 116
        '+573123698521'   // CO, Carrier code 312
      ]

    }

  },

  // The troop settings to create and rename troops with
  troop: {

    // You can change name and newName as you see fit
    name: 'Pro Troop',
    newName: 'Troopie',

    // DO NOT CHANGE
    permissions: {
      owner: 0,
      admin: 1,
      member: 2
    },

    // DO NOT CHANGE
    permissionNames: [
      'Owner',
      'Admin',
      'Member'
    ]

  },

  // The browser settings
  browser: {

    // Can be localhost or 0.0.0.0
    domain: 'http://localhost:9000/',

    // Determines the browser window initial dimensions (used for switching to tablet or mobile view)
    window: {
      width: 1030,
      height: 1200,
      maximized: true
    },

    // DO NOT CHANGE
    viewport: {
      tablet: 1024,
      mobile: 540
    }

  },

  // The MySQL settings to connect and execute queries, change them to match your local MySQL settings
  mySql: {

    host: 'localhost',
    user: 'root',
    password: 'local',
    database: 'troop-prod',

    tables: {
      codes: 'signupcodes',
      users: 'users'
    },

    fields: {
      id: 'loginId',
      firstName: 'firstName',
      lastName: 'lastName'
    }

  },

  // The Firebase settings for test to use
  firebase: {

    // Change this to your firebase url
    url: 'https://troop-testing.firebaseio.com/',

    // Change this to the secret key of your firebase
    secret: 'sD5KnFk6rdGjDHELIMEXybi1Dr14Q3n0B6nSlr0O'

  },

  // Determines how should test treat boards
  board: {

    // The fields for creating a singular board (would be overridden if allCombinations is true)
    name: 'Protractor board',
    description: 'This board was made by Protractor!',
    layout: 3,
    readOnly: true,
    private: true,

    // Determines if the singular created board should be archived after
    archive: true,

    // DO NOT CHANGE
    layoutTypes: {
      thumbnail: 0,
      medium: 1,
      panoramic: 2,
      large: 3,
      macro: 4
    },

    // DO NOT CHANGE
    layoutNames: [
      'Thumbnail',
      'Medium',
      'Panoramic',
      'Large',
      'Macro'
    ],

    // Determines if test should create all possible combinations of boards instead of one single board
    allCombinations: false,

    // Determines if the created boards should be archived after (only effective when allCombinations is true)
    archiveCombinations: false

  },

  // Determines how should test treat cards
  card: {

    // The fields for creating a card
    name: 'Protractor card',
    description: 'This card was made by Protractor!',

    // And array of tags to attach to the card
    tags: [
      'protractor',
      'unit-testing',
      'dist'
    ],

    // Determines if the card should be archived after creation
    archive: true,

    // Determines if card's tags should be deleted or not
    archiveTags: true,

    // Determines the board to add the card on (recommended: 'General')
    board: 'General'

  },

  // Determines how should results get reported
  reporter: {

    // Determines if the reporter should write logs into a file (recommended: false)
    fileLog: false,

    // DO NOT CHANGE
    logPath: root + 'test/protractor/tools/reporter/reporter.log',

    // DO NOT CHANGE
    configPath: root + 'test/protractor/tools/reporter/reporter.conf.json',

    // DO NOT CHANGE
    prefixes: {
      spec: '>',
      info: '-',
      success: '✓',
      error: '✗',
      warning: '!',
      indent: '   '
    },

    // DO NOT CHANGE
    colors: {

      foreground: {
        white: '\x1b[37m',
        green: '\x1b[32m',
        red: '\x1b[31m',
        yellow: '\x1b[33m',
        black: '\x1b[30m'
      },

      background: {
        green: '\x1b[42m',
        red: '\x1b[41m',
        yellow: '\x1b[43m',
        blue: '\x1b[44m'
      },

      reset: '\x1b[0m'

    },

    // DO NOT CHANGE
    types: {
      standard: 0,
      header: 1,
      headerBold: 2,
      footer: 3
    }

  }

};
