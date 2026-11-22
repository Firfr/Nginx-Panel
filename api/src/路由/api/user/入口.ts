import { Hono } from "hono";
import 用户信息 from "./info";
import 用户名列表 from "./list";

const Router = new Hono();

Router.route("/info", 用户信息);
Router.route("/list", 用户名列表);

export default Router;
