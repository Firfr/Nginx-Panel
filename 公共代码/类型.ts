export interface t_成功返回<T = any> {
  状态: true;
  信息?: string;
  内容: T;
}

// 定义失败类型（状态=false，没有 内容）
interface 失败返回 {
  状态: false;
  信息: string;
}

// 最终返回类型 = 成功 | 失败
export type t_返回<T = any> = t_成功返回<T> | 失败返回;

export interface t_Nginx状态 {
  状态: boolean;
  pid: number | null;
  信息: string;
}

export interface t_账号信息_基础配置 {
  创建时间戳: number;
  启用: boolean;
  用户名: string;
  备注: string;
  密码: string;
  登录设备: number;
  登录天数: number;
}

export interface t_账号信息_TOTP {
  密钥: string;
  算法: "SHA1";
  位数: number;
  周期: 30;
}

export interface t_账号信息 extends t_账号信息_基础配置 {
  TOTP?: t_账号信息_TOTP;
}

export type t_账号信息_表单 = t_账号信息_基础配置 &
  t_账号信息_TOTP & {
    TOTP: boolean;
  };

export interface t_账号信息_更新 {
  启用?: boolean;
  备注?: string;
  密码?: string;
  登录设备?: number;
  登录天数?: number;
  TOTP: boolean;
  TOTP_改变: boolean;
  TOTP_密钥?: string;
}

export interface t_账号总览信息 {
  启用: boolean;
  用户名: string;
  备注: string;
  登录设备: number;
  登录天数: number;
  创建时间: number;
  TOTP: boolean;
}

export interface t_证书信息 {
  文件名称: string;
  签发机构: string;
  生效时间: string;
  到期时间: string;
  到期天数: number | null;
  域名: string[];
}

export interface t_配置 {
  端口: number;
  面板?: {
    名称?: string;
    完整地址?: string;
    路径?: string;
  };
  编辑?: {
    名称?: string;
    完整地址?: string;
    路径?: string;
  };
}
