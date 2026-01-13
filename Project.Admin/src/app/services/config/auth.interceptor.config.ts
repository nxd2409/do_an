import { HttpInterceptorFn } from '@angular/common/http';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('X-Bypass-Auth')) {
    const newHeaders = req.headers.delete('X-Bypass-Auth');
    const cleanReq = req.clone({ headers: newHeaders });
    return next(cleanReq);
  }

  const authToken = localStorage.getItem('accessToken')

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${authToken}`
    },
  });

  return next(authReq);
};
