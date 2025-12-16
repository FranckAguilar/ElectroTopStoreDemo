<?php

namespace Database\Seeders;

use App\Models\OrderStatus;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $customerRole = Role::firstOrCreate(['name' => 'customer']);

        foreach ([
            'NETWORKING',
            'CCTV',
            'VIDEO PORTEROS E INTERCOMUNICADORES',
            'RADIOS MOVILES',
            'CONTROL ACCESO Y ASISTENCIA',
            'ALARMA ROBOS',
            'ALARMA INCENDIOS',
            'ALMACENAMIENTO',
            'FUENTES, TRANSFORMADORES Y UPS',
        ] as $name) {
            $slug = Str::slug($name);
            \App\Models\Category::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'parent_id' => null],
            );
        }

        foreach ([
            'TP-Link',
            'Hikvision',
            'ZKTeco',
            'Hytera',
            'EZVIZ',
            'Western Digital',
            'NewLink',
            'Cofem',
            'Forza',
            'STV',
        ] as $name) {
            $slug = Str::slug($name);
            $brand = \App\Models\Brand::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'logo_path' => null],
            );

            if ($brand->logo_path === null) {
                $files = Storage::disk('public')->files("brands/{$brand->id}");
                if (count($files) > 0) {
                    $brand->forceFill(['logo_path' => $files[0]])->save();
                }
            }
        }

        foreach (['pending', 'paid', 'shipped', 'delivered', 'cancelled'] as $status) {
            OrderStatus::firstOrCreate(['name' => $status]);
        }

        User::firstOrCreate(
            ['email' => 'admin@electrotopstore.test'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
            ],
        );

        User::firstOrCreate(
            ['email' => 'test@electrotopstore.test'],
            [
                'name' => 'Test Customer',
                'password' => Hash::make('password'),
                'role_id' => $customerRole->id,
            ],
        );

        foreach ([
            'store.phone' => '+51 987 654 321',
            'store.email' => 'ventas@electrotop.pe',
            'store.schedule' => "Lun - S\u{00E1}b: 9:00 AM - 7:00 PM",
            'store.address' => "Av. Demo 123, Lima, Per\u{00FA}",
            'store.maps_url' => 'https://www.google.com/maps',
            'store.maps_embed_url' => 'https://www.google.com/maps?q=Av.%20Demo%20123%2C%20Lima%2C%20Per%C3%BA&output=embed',
            'store.whatsapp' => '51987654321',
            'home.recommended_product_ids' => '[]',
            'home.best_sellers_days' => '30',
            'home.best_sellers_limit' => '12',
        ] as $key => $value) {
            Setting::firstOrCreate(['key' => $key], ['value' => $value]);
        }

        if (Schema::hasTable('products') && \App\Models\Product::query()->count() === 0) {
            $this->call(CsvCatalogSeeder::class);
        }
    }
}
