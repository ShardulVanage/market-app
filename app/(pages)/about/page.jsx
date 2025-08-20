import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Globe, Shield, TrendingUp, Clock, Search, Award, Briefcase, CheckCircle } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 ">
      {/* Hero Section */}
      <div className="bg-[#29688A] text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About SME Marketplace</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Connecting global buyers with sellers from verified member companies across diverse industries
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-5xl ">
        {/* Main About Section */}
        <Card className="mb-12 shadow-sm">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-[#29688A] mb-6">About SME Market Place</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                SME Market Place is a platform that connects global buyers with sellers from SME member companies. 
                With over 9500 members from both private and public sectors including SMEs and MNCs and an indirect 
                membership of over 300000 enterprises from 286 national and regional sectoral industry bodies, 
                this platform facilitates e-networking at no cost.
              </p>
              <p>
                This platform facilitates both buyers and sellers the opportunity to build a new business network, 
                find suppliers and customers, and grow their business.
              </p>
              <p>
                The USP of the SME Market Place platform is its verified members who offer authentic products 
                and services at very reasonable prices.
              </p>
              <p>
                The products and services offered by SME Member companies are globally competitive. The Member 
                companies follow business ethics and good corporate governance practices. The credentials of SME 
                member companies are well established for doing businesses with them.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Why Choose Section */}
        <Card className="mb-12 shadow-sm">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-[#29688A] mb-8">Why Choose SME Market Place?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <Globe className="text-[#29688A] w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Zero Cost E-Networking</h3>
                  <p className="text-gray-600 text-sm">Connect with global markets at no cost.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="text-[#29688A] w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Exclusive Access</h3>
                  <p className="text-gray-600 text-sm">Link to a network of over 9500 member companies and their vast employee bases.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <TrendingUp className="text-[#29688A] w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Visibility and Advertising</h3>
                  <p className="text-gray-600 text-sm">Showcase and advertise your products and services.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <TrendingUp className="text-[#29688A] w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Business Growth</h3>
                  <p className="text-gray-600 text-sm">Enhanced visibility creates substantial business opportunities.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="text-[#29688A] w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Accessibility</h3>
                  <p className="text-gray-600 text-sm">Connect buyers and sellers anytime, anywhere.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Search className="text-[#29688A] w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Diverse Market Place</h3>
                  <p className="text-gray-600 text-sm">Access a wide range of products and suppliers.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Award className="text-[#29688A] w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Brand Credibility</h3>
                  <p className="text-gray-600 text-sm">Elevate your brand's credibility and generate valuable leads.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Briefcase className="text-[#29688A] w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Ease of Business</h3>
                  <p className="text-gray-600 text-sm">Simplify operations and enhance the ease of doing business.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="text-[#29688A] w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Verified Members</h3>
                  <p className="text-gray-600 text-sm">Engage with verified members offering authentic products at reasonable prices.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Who Can Join Section */}
        <Card className="mb-12 shadow-sm">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-[#29688A] mb-6">Who can Join and Register?</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                The SME Market Place serves both SME Member Companies and Non-Member Companies from across the globe, 
                providing a platform to e-connect with each other.
              </p>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="text-green-500 w-5 h-5 mt-1 flex-shrink-0" />
                  <p>
                    SME Member Companies can register as sellers on this platform and showcase their products and services. 
                    They can login to SME Market Place portal using their MySME credentials.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="text-green-500 w-5 h-5 mt-1 flex-shrink-0" />
                  <p>
                    Both SME Members and Non-Members can register as buyers on this platform and can search for 
                    required products and services, and e-connect with the sellers.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="text-green-500 w-5 h-5 mt-1 flex-shrink-0" />
                  <p>
                    Unregistered non-members can first register at MySME Platform{' '}
                    <a href="https://cam.mycii.in/" className="text-[#29688A] underline hover:text-blue-800">
                      https://cam.mycii.in/
                    </a>{' '}
                    and then login to SME Market Place to connect with the sellers.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="text-green-500 w-5 h-5 mt-1 flex-shrink-0" />
                  <p>
                    Non-Member Companies can also register their products and services at this platform after 
                    obtaining SME Membership. To obtain SME Membership, write to SME at{' '}
                    <a href="mailto:membership@cii.in" className="text-[#29688A] underline hover:text-blue-800">
                      membership@cii.in
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Links */}
        

        {/* Call to Action Buttons */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-[#29688A] hover:bg-[#1e4d68] text-white px-8 py-3 text-lg font-medium"
            >
              Login
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-[#29688A] text-[#29688A] hover:bg-[#29688A] hover:text-white px-8 py-3 text-lg font-medium"
            >
              Register
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;