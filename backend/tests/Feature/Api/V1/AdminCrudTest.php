<?php

namespace Tests\Feature\Api\V1;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminCrudTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (! extension_loaded('pdo_sqlite')) {
            $this->markTestSkipped('pdo_sqlite extension is not enabled; cannot run DB tests with sqlite :memory:.');
        }

        $this->artisan('migrate:fresh');
    }

    private function makeAdminWithToken(): array
    {
        $role = Role::query()->create(['name' => 'admin']);

        /** @var User $admin */
        $admin = User::query()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => 'password',
            'role_id' => $role->id,
        ]);

        $plainToken = Str::random(80);
        $admin->forceFill(['api_token' => hash('sha256', $plainToken)])->save();

        return [$admin, $plainToken];
    }

    public function test_non_admin_cannot_create_category(): void
    {
        $role = Role::query()->create(['name' => 'customer']);

        /** @var User $user */
        $user = User::query()->create([
            'name' => 'User',
            'email' => 'user@example.com',
            'password' => 'password',
            'role_id' => $role->id,
        ]);

        $plainToken = Str::random(80);
        $user->forceFill(['api_token' => hash('sha256', $plainToken)])->save();

        $this->withHeader('Authorization', 'Bearer '.$plainToken)
            ->postJson('/api/v1/admin/categories', [
                'name' => 'CCTV',
                'slug' => 'cctv',
            ])
            ->assertStatus(403);
    }

    public function test_admin_can_create_product(): void
    {
        [, $token] = $this->makeAdminWithToken();

        $category = Category::query()->create(['name' => 'CCTV', 'slug' => 'cctv']);
        $brand = Brand::query()->create(['name' => 'Hikvision', 'slug' => 'hikvision']);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/admin/products', [
                'codigo' => 'SKU-001',
                'name' => 'Camara 2MP',
                'description' => 'Test',
                'category_id' => $category->id,
                'brand_id' => $brand->id,
                'price' => 199.90,
                'stock_quantity' => 10,
                'status' => 'active',
            ])
            ->assertStatus(201)
            ->assertJsonPath('product.codigo', 'SKU-001');
    }
}
