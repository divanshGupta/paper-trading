# Details

Date : 2025-11-22 23:57:16

Directory c:\\Users\\divya\\trading-simulator\\backend

Total : 41 files,  29533 codes, 497 comments, 393 blanks, all 30423 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [backend/Dockerfile](/backend/Dockerfile) | Docker | 9 | 9 | 9 | 27 |
| [backend/nodemon.json](/backend/nodemon.json) | JSON | 20 | 0 | 1 | 21 |
| [backend/package-lock.json](/backend/package-lock.json) | JSON | 2,667 | 0 | 1 | 2,668 |
| [backend/package.json](/backend/package.json) | JSON | 41 | 0 | 1 | 42 |
| [backend/prisma/migrations/20251105141608\_init\_public/migration.sql](/backend/prisma/migrations/20251105141608_init_public/migration.sql) | MS SQL | 26 | 3 | 6 | 35 |
| [backend/prisma/migrations/20251106140527\_user\_model/migration.sql](/backend/prisma/migrations/20251106140527_user_model/migration.sql) | MS SQL | 10 | 3 | 4 | 17 |
| [backend/prisma/migrations/20251110180047\_database\_update/migration.sql](/backend/prisma/migrations/20251110180047_database_update/migration.sql) | MS SQL | 7 | 14 | 4 | 25 |
| [backend/prisma/migrations/20251110210129\_transacation\_model\_update/migration.sql](/backend/prisma/migrations/20251110210129_transacation_model_update/migration.sql) | MS SQL | 3 | 1 | 1 | 5 |
| [backend/prisma/migrations/20251110212055\_add\_precision\_realized\_pnl/migration.sql](/backend/prisma/migrations/20251110212055_add_precision_realized_pnl/migration.sql) | MS SQL | 1 | 7 | 1 | 9 |
| [backend/prisma/migrations/20251111105630\_fix\_decimal\_precision\_all/migration.sql](/backend/prisma/migrations/20251111105630_fix_decimal_precision_all/migration.sql) | MS SQL | 3 | 8 | 1 | 12 |
| [backend/prisma/migrations/20251111110012\_make\_realized\_pnl\_optional/migration.sql](/backend/prisma/migrations/20251111110012_make_realized_pnl_optional/migration.sql) | MS SQL | 1 | 1 | 1 | 3 |
| [backend/prisma/migrations/20251112054849\_add\_profile\_fields/migration.sql](/backend/prisma/migrations/20251112054849_add_profile_fields/migration.sql) | MS SQL | 8 | 8 | 2 | 18 |
| [backend/prisma/migrations/20251112055158\_add\_updatedat\_optional/migration.sql](/backend/prisma/migrations/20251112055158_add_updatedat_optional/migration.sql) | MS SQL | 1 | 1 | 1 | 3 |
| [backend/prisma/migrations/20251112055241\_make\_updatedat\_required/migration.sql](/backend/prisma/migrations/20251112055241_make_updatedat_required/migration.sql) | MS SQL | 1 | 7 | 1 | 9 |
| [backend/prisma/schema.prisma](/backend/prisma/schema.prisma) | Prisma | 50 | 11 | 18 | 79 |
| [backend/src/app.js](/backend/src/app.js) | JavaScript | 62 | 8 | 15 | 85 |
| [backend/src/config/env.js](/backend/src/config/env.js) | JavaScript | 24 | 3 | 5 | 32 |
| [backend/src/config/socket.js](/backend/src/config/socket.js) | JavaScript | 24 | 2 | 9 | 35 |
| [backend/src/controllers/portfolio.controller.js](/backend/src/controllers/portfolio.controller.js) | JavaScript | 13 | 0 | 5 | 18 |
| [backend/src/controllers/trade.controller.js](/backend/src/controllers/trade.controller.js) | JavaScript | 168 | 169 | 73 | 410 |
| [backend/src/controllers/transaction.controller.js](/backend/src/controllers/transaction.controller.js) | JavaScript | 180 | 16 | 49 | 245 |
| [backend/src/controllers/user.controller.js](/backend/src/controllers/user.controller.js) | JavaScript | 89 | 5 | 22 | 116 |
| [backend/src/controllers/watchlist.controller.js](/backend/src/controllers/watchlist.controller.js) | JavaScript | 66 | 1 | 26 | 93 |
| [backend/src/middlewares/auth.middleware.js](/backend/src/middlewares/auth.middleware.js) | JavaScript | 29 | 2 | 8 | 39 |
| [backend/src/middlewares/error.middleware.js](/backend/src/middlewares/error.middleware.js) | JavaScript | 6 | 0 | 3 | 9 |
| [backend/src/middlewares/socketAuth.middleware.js](/backend/src/middlewares/socketAuth.middleware.js) | JavaScript | 13 | 1 | 4 | 18 |
| [backend/src/routes/market.routes.js](/backend/src/routes/market.routes.js) | JavaScript | 7 | 0 | 4 | 11 |
| [backend/src/routes/portfolio.routes.js](/backend/src/routes/portfolio.routes.js) | JavaScript | 6 | 0 | 3 | 9 |
| [backend/src/routes/trade.routes.js](/backend/src/routes/trade.routes.js) | JavaScript | 8 | 2 | 3 | 13 |
| [backend/src/routes/transaction.routes.js](/backend/src/routes/transaction.routes.js) | JavaScript | 8 | 0 | 3 | 11 |
| [backend/src/routes/user.routes.js](/backend/src/routes/user.routes.js) | JavaScript | 9 | 4 | 6 | 19 |
| [backend/src/routes/watchlist.routes.js](/backend/src/routes/watchlist.routes.js) | JavaScript | 16 | 1 | 8 | 25 |
| [backend/src/server.js](/backend/src/server.js) | JavaScript | 28 | 17 | 12 | 57 |
| [backend/src/services/priceEngine.js](/backend/src/services/priceEngine.js) | JavaScript | 476 | 176 | 60 | 712 |
| [backend/src/services/priceStorage.js](/backend/src/services/priceStorage.js) | JavaScript | 20 | 0 | 4 | 24 |
| [backend/src/storage/prices.json](/backend/src/storage/prices.json) | JSON | 25,378 | 0 | 0 | 25,378 |
| [backend/src/utils/ApiError.js](/backend/src/utils/ApiError.js) | JavaScript | 6 | 0 | 0 | 6 |
| [backend/src/utils/db.js](/backend/src/utils/db.js) | JavaScript | 10 | 2 | 4 | 16 |
| [backend/src/utils/marketTimes.js](/backend/src/utils/marketTimes.js) | JavaScript | 3 | 11 | 5 | 19 |
| [backend/src/utils/supabaseClient.js](/backend/src/utils/supabaseClient.js) | JavaScript | 28 | 1 | 6 | 35 |
| [backend/src/websocket/stockTicker.js](/backend/src/websocket/stockTicker.js) | JavaScript | 8 | 3 | 4 | 15 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)