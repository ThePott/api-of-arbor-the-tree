import express from "express"
import cors, { type CorsOptions } from "cors"
import checkHealthRouter from "./routers/checkHealthRouter.js"
import { checkEnvVar } from "./utils/checkEnvVar.js"

const app = express()

const corsOptions: CorsOptions = {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", checkEnvVar(process.env.CLIENT_ORIGIN)],
    methods: ["OPTIONS", "GET", "POST", "PATCH", "PUT", "DELETE"],
}
app.use(cors(corsOptions))
app.use("/", checkHealthRouter)

const port = process.env.PORT || 3000

app.listen(port, () => console.log("---- server is running on:", port))
