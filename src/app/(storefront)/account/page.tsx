import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/account");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Account</h1>

      <div className="max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {session.user.image && (
              <div className="flex justify-center">
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? ""}
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{session.user.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{session.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium">{session.user.role}</p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/orders">View My Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
