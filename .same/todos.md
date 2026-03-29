# Agent Portal ATS - Todos
## Completado
- [x] Clonar repositorio de GitHub
- [x] Eliminar barra de header verde del Agent Mail
- [x] Crear endpoint SSO `/api/mail/sso` para auto-login tipo Okta SWA
- [x] Modificar página de mail para usar SSO automático
- [x] Agregar cierre de sesión de Roundcube cuando se cierra sesión del portal
- [x] Mejorar manejo de caracteres especiales en credenciales (base64 encoding)
- [x] Linting pasado sin errores
## Notas Técnicas
### Cómo funciona el SSO (tipo Okta SWA):
1. El usuario navega a la página de Agent Mail en el portal
2. La página obtiene el token de sesión de Supabase
3. Se carga el endpoint `/api/mail/sso?token=...` en un iframe
4. El endpoint:
   - Verifica el token del usuario
   - Obtiene las credenciales del mail desde la base de datos
   - Descifra la contraseña
   - Genera una página HTML que hace auto-submit del formulario de login a Roundcube
5. Roundcube procesa el login y muestra el webmail
### Logout sincronizado:
- Cuando el usuario cierra sesión del portal (`signOut` en AuthProvider)
- Se carga la URL de logout de Roundcube en un iframe oculto
- Esto cierra la sesión del mail también
### Archivos modificados:
- `src/app/mail/page.tsx` - Página limpia sin barra de header, usa SSO
- `src/app/api/mail/sso/route.ts` - Nuevo endpoint SSO
- `src/components/providers/AuthProvider.tsx` - Logout sincronizado
