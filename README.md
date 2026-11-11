# Portfolio editorial

Sitio público y estudio privado para una fotógrafa documental. El público ve solo lo publicado. La administración entra con una cuenta ya autorizada, carga fotografías y el servidor las convierte a WebP antes de guardarlas.

No hay datos personales inventados. El nombre, la biografía y las fotografías se cargan desde el estudio.

## Qué hace falta

- Node.js 22 o superior. El SDK actual de Supabase lo declara como requisito.
- Una cuenta de [Supabase](https://supabase.com).
- Una cuenta de [Vercel](https://vercel.com) para publicarlo.

La clave `service_role` no se usa. Todas las operaciones de administración pasan por la sesión de la usuaria y por las políticas de Postgres.

## 1. Crear el proyecto en Supabase

1. Creá un proyecto nuevo.
2. En **Project Settings → API** copiá la URL del proyecto y la clave pública. En el panel puede figurar como `anon` o `publishable`: es la misma clave pública.
3. En **Authentication → Sign In / Providers → Email**, desactivá **Allow new users to sign up**. El sitio no tiene registro público.
4. En **Authentication → URL Configuration** agregá:
   - Site URL: `http://localhost:3000` durante el desarrollo, y el dominio de Vercel en producción.
   - Redirect URLs: `http://localhost:3000/auth/callback` y `https://tu-dominio/auth/callback`.

## 2. Ejecutar la migración

Abrí **SQL Editor** y pegá el contenido completo de:

`supabase/migrations/20261110180000_init.sql`

Eso crea las tablas, activa Row Level Security, crea los buckets `portfolio`, `library` e `incoming`, y deja una fila vacía de configuración.

Si usás la CLI de Supabase, el mismo archivo se aplica con `supabase db push`.

## 3. Crear la primera administradora

1. En **Authentication → Users → Add user**, cargá el correo y una contraseña. Marcá **Auto Confirm User**.
2. Copiá el UUID de esa usuaria.
3. Ejecutá en el SQL Editor, reemplazando el UUID:

```sql
update public.profiles
set role = 'admin',
    full_name = ''
where id = '00000000-0000-0000-0000-000000000000';
```

El alta de una usuaria crea un perfil con rol `pending`. Hasta este `update`, no puede entrar al estudio. La aplicación no permite cambiar el propio rol.

## 4. Variables de entorno

Copiá `.env.example` a `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_SITE_URL` se usa para el mapa del sitio, los metadatos y el correo de recuperación de contraseña. En Vercel tiene que ser la URL pública, con `https`.

## 5. Desarrollo

```bash
npm install
npm run dev
```

El sitio público queda en `/`. El estudio queda en `/admin`.

## Cómo usar el estudio

1. Entrá a `/admin` con el correo autorizado.
2. En **Configuración**, completá el nombre, la profesión, la biografía, la formación, los intereses, la declaración, el correo, Instagram y otros enlaces. Ahí también se suben el retrato y la fotografía de portada.
3. En **Series → Nueva serie**, creá el trabajo. Podés dejarlo como borrador.
4. Dentro de la serie, arrastrá las fotografías o elegilas. Se procesan de a una.
5. Editá epígrafe, texto alternativo, fecha y lugar. Guardá con **Guardar epígrafes**.
6. Elegí la portada, ordená con **Subir**, **Bajar** o arrastrando el control **Arrastrar**.
7. Marcá **Publicada** y guardá la serie. Recién ahí las fotografías publicadas pasan al bucket público.
8. **Vista previa** muestra la serie, incluso si sigue en borrador.

Si olvidó la contraseña, `/admin/recuperar` envía un enlace. La URL de retorno tiene que estar autorizada en Supabase.

## Imágenes y almacenamiento

El navegador sube el original a un bucket privado y temporario (`incoming`). Una acción del servidor:

- comprueba que el archivo sea JPEG, PNG, WebP o TIFF;
- rechaza archivos de más de 20 MB;
- corrige la orientación y elimina EXIF y GPS;
- no recorta ni agranda;
- limita el lado mayor a 2000 px;
- guarda una sola versión WebP con calidad 82;
- borra el original.

Los parámetros están en `src/lib/image-processing/config.ts`.

Los borradores viven en el bucket privado `library`. Al publicar, el archivo se mueve a `portfolio` y recién ahí tiene URL pública. Despublicar lo devuelve al bucket privado. No se guardan copias de distintos tamaños: Next/Image genera las variantes de entrega.

El panel muestra el peso original, el peso optimizado, la reducción y las medidas. El total del panel suma lo que este sitio registró. El plan gratuito de Supabase incluye 1 GB para todo el proyecto.

RAW y HEIC no se aceptan. Hay que exportarlos a JPEG o TIFF antes de subirlos.

## Seguridad

- Las políticas de Postgres permiten leer al público solo series y fotografías publicadas.
- Insertar, editar y borrar exige el rol `admin`, verificado en la base.
- El proxy refresca la sesión. El layout del estudio vuelve a comprobar el rol en el servidor.
- No hay página de registro.

## Despliegue en Vercel

1. Importá el repositorio.
2. Elegí Node.js 22.
3. Cargá las tres variables de entorno.
4. El dominio de producción tiene que estar en las URLs de Supabase, y `NEXT_PUBLIC_SITE_URL` tiene que coincidir con ese dominio.
5. Volvé a desplegar si cambiás las variables: el sitio las necesita en el servidor.

## Esquema

Además de las tablas pedidas, la migración agrega:

- `education` e `interests`, porque Sobre mí tiene que poder editarse por separado.
- `social_links`, para los enlaces profesionales.
- textos alternativos y medidas del retrato y de la portada.
- `cover_photograph_id`, para no perder la portada cuando la serie todavía es privada.
- `storage_bucket` y `original_file_size_bytes`, para borrar el archivo correcto y mostrar el ahorro de peso.
