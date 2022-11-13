---
date: 2022-11-13
highlight: atelier-heath-light
theme: smartblue
---

# 在 Spring boot 中对响应统一处理

## 统一响应

我们期望返回的数据结构是始终是

```json
{
  "data": "any type",
  "message": "SUCCESS",
  "code": 10000,
  "timestamp": 123
}
```

其中：

- data: 用于存放响应数据。
- message: 本次响应的信息。成功返回 "SUCCESS", 失败则返回失败的提示信息，例如："用户名不存在"。
- code: 标识本次响应的类型。code == 10000 表示本次请求成功，code != 10000 表示本次请求失败，不同的 code 标识不同的失败类型。
- timestamp(optional): 本次响应的时间戳

我们先为这个响应创建一个类(`ApiRestResponse`)进行管理：

```java
// common.ApiRestResponse
package com.exception.handler.exception.handler.common;

import java.util.Date;

public class ApiRestResponse<T> {
  private Integer code;
  private String message;
  private T data;
  private Long timestamp;

  private static final Integer OK_CODE = 10000;
  private static final String OK_MESSAGE = "SUCCESS";

  public ApiRestResponse(Integer code, String message, T data) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().getTime();
  }

  public ApiRestResponse() {
    this(OK_CODE, OK_MESSAGE, null);
  }

  public ApiRestResponse(T data) {
    this(OK_CODE, OK_MESSAGE, data);
  }

  public ApiRestResponse(Integer code, String message) {
    this(code, message, null);
  }

  public static ApiRestResponse success() {
    return new ApiRestResponse();
  }

  public static <T> ApiRestResponse<T> success(T data) {
    return new ApiRestResponse(data);
  }

  public static <T> ApiRestResponse<T> error(Integer code, String message) {
    return new ApiRestResponse<T>(code, message);
  }

  public Integer getCode() {
    return code;
  }

  public void setCode(Integer code) {
    this.code = code;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public T getData() {
    return data;
  }

  public void setData(T data) {
    this.data = data;
  }

  public Long getTimestamp() {
    return timestamp;
  }

  public void setTimestamp(Long timestamp) {
    this.timestamp = timestamp;
  }
}
```

我们为该类提供几个静态方法，方便我们创建对象。

我们为错误请求提供了 `error` 的静态方法，但每次传入 code 和 message 都是不同的。为此，我们可以提供一个枚举类来管理我们异常响应：

## 创建异常枚举

```java
// exception.MyExceptionEnum

package com.exception.handler.exception.handler.exception;

public enum MyExceptionEnum {
  NEED_USER(10001, "用户不存在");

  String message;
  Integer code;

  MyExceptionEnum(Integer code, String message) {
    this.message = message;
    this.code = code;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public Integer getCode() {
    return code;
  }

  public void setCode(Integer code) {
    this.code = code;
  }
}
```

有了这个枚举类，我们可以把所有的异常都存放在枚举类中。例如：上面我们创建的 `NEED_USER` 枚举类。

接下来，我们为 `ApiRestResponse` 提供额外的 `error` 静态方法来接收异常枚举对象。

```java
// common.ApiRestResponse
public class ApiRestResponse<T> {

  public static <T> ApiRestResponse<T> error(MyExceptionEnum e) {
    return new ApiRestResponse<T>(e.getCode(), e.getMessage());
  }
}
```

## 自定义异常类

我们可以在 controller 层返回 `ApiRestResponse`，但是在 service 层可不能这么做，如果 service 层遇到错误，最常用的
方法就是抛出异常。为了后续能统一异常处理，这里我们自定义
异常类：

```java
// exception.MyException

package com.exception.handler.exception.handler.exception;

public class MyException extends Exception {
  private Integer code;
  private String message;

  public MyException(Integer code, String message) {
    this.code = code;
    this.message = message;
  }

  public MyException(MyExceptionEnum e) {
    this(e.getCode(), e.getMessage());
  }

  public Integer getCode() {
    return code;
  }

  public void setCode(Integer code) {
    this.code = code;
  }

  @Override
  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }
}
```

与 `ApiRestResponse.error` 类似，我们为 `MyException` 也提供了接受 `MyExceptionEnum` 枚举类的构造函数。

至此，前期的准备工作已经完毕。我们再对异常进行统一处理：


## 对异常的统一处理

```java
package com.exception.handler.exception.handler.exception;

import com.exception.handler.exception.handler.common.ApiRestResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;


@ControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(Exception.class)
  @ResponseBody
  public Object handleException(Exception e) {
//    logger.error("Default Exception: ", e);
    System.out.println("Default Exception: " + e);
    return ApiRestResponse.error(MyExceptionEnum.SYSTEM_ERROR);
  }

  @ExceptionHandler(MyException.class)
  @ResponseBody
  public Object handleMyException(MyException e) {
//    logger.error("MyException: ", e);
    System.out.println("MyException: " + e);
    return ApiRestResponse.error(e.getCode(), e.getMessage());
  }
}
```

我们通过 Spring boot 注解形式，拦截所有的异常对象，
对不同异常处理后，返回统一的 `ApiRestResponse`。

至此，在 Spring boot 对响应统一处理就已经完成。
