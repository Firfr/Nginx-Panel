import { Hono } from "hono";
import 登录 from "./auth/login";
import 退出 from "./auth/logout";
import 登录状态 from "./auth/verify";

const Router = new Hono();

Router.route("/login", 登录);
Router.route("/logout", 退出);
Router.route("/verify", 登录状态);

export default Router;
