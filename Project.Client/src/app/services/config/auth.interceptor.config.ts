import { HttpInterceptorFn, HttpContextToken } from '@angular/common/http';
export const BYPASS_AUTH = new HttpContextToken<boolean>(() => false);

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('X-Bypass-Auth')) {
    const newHeaders = req.headers.delete('X-Bypass-Auth');
    const cleanReq = req.clone({ headers: newHeaders });
    return next(cleanReq);
  }
  const bypass = req.context.get(BYPASS_AUTH);
  if (bypass) {
    return next(req); // không thêm Authorization
  }

  const authToken = localStorage.getItem('accessToken');

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  return next(authReq);
};


