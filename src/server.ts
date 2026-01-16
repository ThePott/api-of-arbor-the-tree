import "dotenv/config"
import express from "express"
import cors, { type CorsOptions } from "cors"
import checkHealthRouter from "./routers/checkHealthRouter.js"
import authRouter from "./routers/authRouter.js"
import schoolRouter from "./routers/schoolRouter.js"
import hagwonRouter from "./routers/hagwonRouter.js"
import bookRouter from "./routers/bookRouter.js"
import errorRequestHandler from "./errors/errorRequestHandler.js"
import { CLIENT_ORIGIN } from "./config/env.js"
import cookieParser from "cookie-parser"
import manageRouter from "./features/manage/route/index.js"

const app = express()

const corsOptions: CorsOptions = {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", CLIENT_ORIGIN],
    methods: ["OPTIONS", "GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
}
app.use(express.json())
app.use(express.text())
app.use(cors(corsOptions))
app.use(cookieParser())

app.use("/auth", authRouter)
app.use("/school", schoolRouter)
app.use("/hagwon", hagwonRouter)
app.use("/book", bookRouter)
app.use("/manage", manageRouter)
app.use("/", checkHealthRouter)

app.use(errorRequestHandler)

const port = process.env.PORT || 3000

app.listen(port, () => console.log("---- server is running on:", port))
