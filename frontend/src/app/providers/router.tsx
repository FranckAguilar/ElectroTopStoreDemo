import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/app/layouts/AdminLayout'
import { PublicLayout } from '@/app/layouts/PublicLayout'
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage/AdminLoginPage'
import { HomeAdminPage } from '@/pages/admin/HomeAdminPage/HomeAdminPage'
import { AdminPanelPage } from '@/pages/admin/AdminPanelPage/AdminPanelPage'
import { BrandsAdminPage } from '@/pages/admin/BrandsAdminPage/BrandsAdminPage'
import { CategoriesAdminPage } from '@/pages/admin/CategoriesAdminPage/CategoriesAdminPage'
import { FaqsAdminPage } from '@/pages/admin/FaqsAdminPage/FaqsAdminPage'
import { OrderAdminDetailPage } from '@/pages/admin/OrderAdminDetailPage/OrderAdminDetailPage'
import { OrdersAdminPage } from '@/pages/admin/OrdersAdminPage/OrdersAdminPage'
import { QuoteAdminDetailPage } from '@/pages/admin/QuoteAdminDetailPage/QuoteAdminDetailPage'
import { QuotesAdminPage } from '@/pages/admin/QuotesAdminPage/QuotesAdminPage'
import { PaymentAdminDetailPage } from '@/pages/admin/PaymentAdminDetailPage/PaymentAdminDetailPage'
import { PaymentsAdminPage } from '@/pages/admin/PaymentsAdminPage/PaymentsAdminPage'
import { PaymentMethodsAdminPage } from '@/pages/admin/PaymentMethodsAdminPage/PaymentMethodsAdminPage'
import { ProductsAdminPage } from '@/pages/admin/ProductsAdminPage/ProductsAdminPage'
import { SettingsAdminPage } from '@/pages/admin/SettingsAdminPage/SettingsAdminPage'
import { UsersAdminPage } from '@/pages/admin/UsersAdminPage/UsersAdminPage'
import { ContactPage } from '@/pages/public/ContactPage/ContactPage'
import { CartPage } from '@/pages/public/CartPage/CartPage'
import { CheckoutPage } from '@/pages/public/CheckoutPage/CheckoutPage'
import { FaqPage } from '@/pages/public/FaqPage/FaqPage'
import { HomePage } from '@/pages/public/HomePage/HomePage'
import { LocationPage } from '@/pages/public/LocationPage/LocationPage'
import { OrdersPage } from '@/pages/public/OrdersPage/OrdersPage'
import { PaymentMethodsPage } from '@/pages/public/PaymentMethodsPage/PaymentMethodsPage'
import { ProductDetailPage } from '@/pages/public/ProductDetailPage/ProductDetailPage'
import { ProductsPage } from '@/pages/public/ProductsPage/ProductsPage'
import { ProfilePage } from '@/pages/public/ProfilePage/ProfilePage'

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/productos', element: <ProductsPage /> },
      { path: '/productos/:id', element: <ProductDetailPage /> },
      { path: '/medios-de-pago', element: <PaymentMethodsPage /> },
      { path: '/ubicacion', element: <LocationPage /> },
      { path: '/faqs', element: <FaqPage /> },
      { path: '/contacto', element: <ContactPage /> },
      { path: '/carrito', element: <CartPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/perfil', element: <ProfilePage /> },
      { path: '/mis-pedidos', element: <OrdersPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/admin/login" replace /> },
      { path: 'login', element: <AdminLoginPage /> },
      { path: 'panel', element: <AdminPanelPage /> },
      { path: 'home', element: <HomeAdminPage /> },
      { path: 'categories', element: <CategoriesAdminPage /> },
      { path: 'brands', element: <BrandsAdminPage /> },
      { path: 'payment-methods', element: <PaymentMethodsAdminPage /> },
      { path: 'faqs', element: <FaqsAdminPage /> },
      { path: 'settings', element: <SettingsAdminPage /> },
      { path: 'products', element: <ProductsAdminPage /> },
      { path: 'orders', element: <OrdersAdminPage /> },
      { path: 'orders/:id', element: <OrderAdminDetailPage /> },
      { path: 'payments', element: <PaymentsAdminPage /> },
      { path: 'payments/:id', element: <PaymentAdminDetailPage /> },
      { path: 'quotes', element: <QuotesAdminPage /> },
      { path: 'quotes/:id', element: <QuoteAdminDetailPage /> },
      { path: 'users', element: <UsersAdminPage /> },
    ],
  },
])
