import { useState, useEffect, useContext } from 'react';
import jwt_decode from 'jwt-decode';

import { UserContext } from '@/providers/UserProvider';
import { ListingContext } from '@/providers/ListingProvider';  // Thêm mới để quản lý listing
//import { AmenityContext } from '@/providers/AmenityProvider';  // Comment lại các hooks không sử dụng
//import { AvailabilityContext } from '@/providers/AvailabilityProvider';  // Comment lại các hooks không sử dụng
//import { ImageContext } from '@/providers/ImageProvider';  // Comment lại các hooks không sử dụng
//import { ReviewContext } from '@/providers/ReviewProvider';  // Comment lại các hooks không sử dụng

import { getItemFromLocalStorage, setItemsInLocalStorage, removeItemFromLocalStorage } from '@/utils';
import axiosInstance from '@/utils/axios';

// USER
export const useAuth = () => {
    return useContext(UserContext);
};

export const useProvideAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = getItemFromLocalStorage('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const register = async (formData) => {
        const { first_name, last_name, email, password, role } = formData;
        try {
            const { data } = await axiosInstance.post('user/register', {
                first_name,
                last_name,
                email,
                password,
                role,
            });
            // Trả về email và userId để chuyển hướng sang xác thực mã PIN
            return { success: true, message: data.message, email: data.email, userId: data.userId };
        } catch (error) {
            const { message } = error.response.data;
            return { success: false, message };
        }
    };

    const login = async (formData) => {
        const { email, password } = formData;

        try {
            const { data } = await axiosInstance.post('user/login', {
                email,
                password,
            });
            if (data.user && data.token) {
                setUser(data.user);
                setItemsInLocalStorage('user', data.user);
                setItemsInLocalStorage('token', data.token);
            }
            return { success: true, message: 'Login successful' };
        } catch (error) {
            const { message } = error.response.data;
            return { success: false, message };
        }
    };

    const facebookLogin = async (accessToken) => {
        try {
            const { data } = await axiosInstance.post('user/facebook/login', {
                access_token: accessToken,
            });
            if (data.user && data.token) {
                setUser(data.user);
                setItemsInLocalStorage('user', data.user);
                setItemsInLocalStorage('token', data.token);
            }
            return { success: true, message: 'Login successful' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const logout = async () => {
        try {
            const { data } = await axiosInstance.get('/user/logout');
            if (data.success) {
                setUser(null);
                removeItemFromLocalStorage('user');
                removeItemFromLocalStorage('token');
            }
            return { success: true, message: 'Logout successful' };
        } catch (error) {
            console.log(error);
            return { success: false, message: 'Something went wrong!' };
        }
    };

    const uploadPicture = async (picture) => {
        try {
            const formData = new FormData();
            formData.append('picture', picture);
            const { data } = await axiosInstance.post('/user/upload-picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data;
        } catch (error) {
            console.log(error);
        }
    };

    const updateUser = async (userDetails) => {
        const { first_name, last_name, password, picture_url } = userDetails;
        const user_id = JSON.parse(getItemFromLocalStorage('user')).user_id;
        try {
            const { data } = await axiosInstance.put('/user/update-user', {
                first_name,
                last_name,
                password,
                user_id,
                picture_url,
            });
            return data;
        } catch (error) {
            console.log(error);
        }
    };

    return {
        user,
        setUser,
        register,
        login,
        facebookLogin,
        logout,
        loading,
        uploadPicture,
        updateUser,
    };
};

// LISTINGS (Thay thế Places)
export const useListings = () => {
    return useContext(ListingContext);
};

// Hook for homepage optimized listings
export const useHomePageListings = (initialLimit = 12) => {
    const [featuredListings, setFeaturedListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeaturedListings = async () => {
            try {
                // Fetch only a limited number of listings for homepage with images
                const { data } = await axiosInstance.get(`/listings?limit=${initialLimit}&featured=true&withImages=true`);
                setFeaturedListings(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching featured listings:', error);
                setLoading(false);
            }
        };

        fetchFeaturedListings();
    }, [initialLimit]);

    return { featuredListings, loading };
};

export const useProvideListings = () => {
    const [listings, setListings] = useState([]);
    const [images, setImages] = useState({});
    const [loading, setLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    // Optimized to load only listings with images for better UX
    const getListings = async (limit = 20) => {
        try {
            setLoading(true);
            // Only fetch listings with images for better user experience
            const { data: listingsData } = await axiosInstance.get(`/listings?limit=${limit}&withImages=true`);
            setListings(listingsData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching listings:', error);
            setLoading(false);
        }
    };

    // Load images for specific listings when needed (lazy loading)
    const loadImagesForListings = async (listingIds) => {
        const promises = listingIds.map(async (listingId) => {
            if (!images[listingId]) {
                try {
                    const { data: imagesData } = await axiosInstance.get(`/images/${listingId}`);
                    setImages(prev => ({
                        ...prev,
                        [listingId]: imagesData,
                    }));
                } catch (error) {
                    console.warn('Error fetching images for listing:', listingId, error);
                }
            }
        });
        await Promise.all(promises);
    };

    // Load more listings for infinite scroll or pagination
    const loadMoreListings = async (offset = 0, limit = 20) => {
        try {
            const { data: moreListings } = await axiosInstance.get(`/listings?offset=${offset}&limit=${limit}&withImages=true`);
            setListings(prev => [...prev, ...moreListings]);
            return moreListings;
        } catch (error) {
            console.error('Error loading more listings:', error);
            return [];
        }
    };

    // Search listings with filters
    const searchListings = async (filters) => {
        try {
            setIsSearching(true);
            setLoading(true);
            const searchParams = new URLSearchParams();
            
            if (filters.city) searchParams.append('city', filters.city);
            if (filters.priceRange) {
                searchParams.append('minPrice', filters.priceRange[0]);
                searchParams.append('maxPrice', filters.priceRange[1]);
            }
            if (filters.guests) searchParams.append('guests', filters.guests);
            if (filters.homeType) searchParams.append('roomType', filters.homeType);
            // Only search listings with images
            searchParams.append('withImages', 'true');
            
            const { data: searchResults } = await axiosInstance.get(`/listings/search?${searchParams}`);
            setListings(searchResults);
            setLoading(false);
            return searchResults;
        } catch (error) {
            console.error('Error searching listings:', error);
            setLoading(false);
            return [];
        }
    };

    // Reset to initial state
    const resetToDefault = () => {
        setIsSearching(false);
        getListings();
    };

    useEffect(() => {
        getListings();
    }, []);

    return {
        listings,
        setListings,
        images,
        loading,
        isSearching,
        setLoading,
        loadImagesForListings,
        loadMoreListings,
        searchListings,
        resetToDefault,
    };
};

// Comment lại các hooks không sử dụng
// AMENITIES (Tiện ích)
//export const useAmenity = () => {  
//    return useContext(AmenityContext);
//}

//export const useProvideAmenities = () => {
//    const [amenities, setAmenities] = useState([]);
//    const [loading, setLoading] = useState(true);

//    const getAmenities = async (listingId) => {
//        const { data } = await axiosInstance.get(`/amenities/${listingId}`);
//        setAmenities(data);
//        setLoading(false);
//    };

//    useEffect(() => {
//        if (listingId) getAmenities(listingId);
//    }, [listingId]);

//    return {
//        amenities,
//        loading,
//    };
//}

// AVAILABILITY (Tính khả dụng)
//export const useAvailability = () => {  
//    return useContext(AvailabilityContext);
//}

//export const useProvideAvailability = () => {
//    const [availability, setAvailability] = useState([]);
//    const [loading, setLoading] = useState(true);

//    const getAvailability = async (listingId) => {
//        const { data } = await axiosInstance.get(`/availability/${listingId}`);
//        setAvailability(data);
//        setLoading(false);
//    };

//    useEffect(() => {
//        if (listingId) getAvailability(listingId);
//    }, [listingId]);

//    return {
//        availability,
//        loading,
//    };
//}

// IMAGES (Hình ảnh)
//export const useImage = () => {  
//    return useContext(ImageContext);
//}

//export const useProvideImages = () => {
//    const [images, setImages] = useState([]);
//    const [loading, setLoading] = useState(true);

//    const getImages = async (listingId) => {
//        const { data } = await axiosInstance.get(`/images/${listingId}`);
//        setImages(data);
//        setLoading(false);
//    };

//    useEffect(() => {
//        if (listingId) getImages(listingId);
//    }, [listingId]);

//    return {
//        images,
//        loading,
//    };
//}

// REVIEWS (Đánh giá)
//export const useReview = () => {  
//    return useContext(ReviewContext);
//}

//export const useProvideReviews = () => {
//    const [reviews, setReviews] = useState([]);
//    const [loading, setLoading] = useState(true);

//    const getReviews = async (listingId) => {
//        const { data } = await axiosInstance.get(`/reviews/${listingId}`);
//        setReviews(data);
//        setLoading(false);
//    };

//    useEffect(() => {
//        if (listingId) getReviews(listingId);
//    }, [listingId]);

//    return {
//        reviews,
//        loading,
//    };
//};
